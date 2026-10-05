// Pure helpers for the on-demand "AI-read a restaurant's website" feature
// (POST /api/website-lookup). Network I/O (DNS resolution, the actual
// fetch, the Anthropic API call) lives in the route handler so these stay
// unit-testable without hitting anything real.
//
// The safety boundary this whole feature exists under (see LIMITATIONS.md
// and DATA_SOURCES.md): this never produces a score, badge, or
// "compatible" verdict. It only ever returns quoted excerpts of what a
// restaurant's own site actually says, labeled unverified, for the user to
// read themselves.

const MAX_PROMPT_CHARS = 12000;

export function isAllowedProtocol(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Reasonable-effort SSRF guard: rejects the IP ranges that matter for this
// threat model (a restaurant `website` tag is untrusted, community-sourced
// OSM data, and could point at an internal address). Not a defense against
// active DNS-rebinding — out of scope for what this feature needs.
export function isPrivateOrLoopbackIp(ip) {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("::ffff:")) {
      return isPrivateOrLoopbackIp(lower.slice("::ffff:".length));
    }
    return false;
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

export function stripHtmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateForPrompt(text, maxChars = MAX_PROMPT_CHARS) {
  return text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
}

// Builds the system/user message pair sent to the Anthropic Messages API.
// Deliberately strict: quote-only, no inference, explicit "nothing found"
// path — this is the whole safety boundary of the feature.
//
// `craving` is optional (Find a Dish reuses this same single-restaurant
// checker rather than a parallel AI pipeline that would pick/rank across
// restaurants — see LIMITATIONS.md's "Two trust tiers": restaurant
// selection here is always deterministic/human-driven, AI only ever reads
// the one site a human already clicked into).
export function buildExtractionMessages(restaurantName, pageText, craving) {
  const cravingInstruction = craving
    ? ` Also look for any mention of a dish, ingredient, or cuisine matching ` +
      `"${craving}" — quote it the same way, under the same rules.`
    : "";

  const system =
    "You extract ONLY allergen, ingredient, and dietary information that is " +
    "explicitly present in the given webpage text — this includes both " +
    "per-dish allergen/ingredient statements AND restaurant-level dietary " +
    'claims (e.g. "100% vegan", "gluten-free kitchen", "peanut-free", ' +
    '"we do not use tree nuts").' +
    cravingInstruction +
    " Never infer, guess, generalize, or add " +
    "information not literally present — quote only text that is actually " +
    "on the page. Ignore unrelated marketing copy, hours, addresses, and " +
    "navigation text. If the page has none of this information, say so " +
    "plainly. Respond with ONLY a JSON object, no other text, in exactly " +
    'this shape: {"found": boolean, "excerpts": [{"quote": "exact text ' +
    'from the page", "note": "one short sentence of plain-language ' +
    'context"}]}. "excerpts" must be empty if "found" is false.';

  const user =
    `Restaurant: ${restaurantName}\n\nWebpage text:\n${truncateForPrompt(pageText)}`;

  return { system, user };
}

// Parses the Anthropic response text into the { found, excerpts, sourceUrl }
// shape the client renders. Any malformed/unexpected response degrades to
// an honest "nothing found" rather than surfacing something unverified.
// Claude sometimes wraps its JSON reply in a ```json fence despite the
// system prompt asking for a bare object — strip that before parsing so a
// real, correctly-extracted result never gets silently discarded.
function stripCodeFence(text) {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : text;
}

export function parseExtractionResponse(rawText) {
  try {
    const parsed = JSON.parse(stripCodeFence(rawText));
    if (typeof parsed.found !== "boolean" || !Array.isArray(parsed.excerpts)) {
      return { found: false, excerpts: [] };
    }
    const excerpts = parsed.excerpts
      .filter((e) => e && typeof e.quote === "string" && e.quote.trim().length > 0)
      .map((e) => ({
        quote: e.quote,
        note: typeof e.note === "string" ? e.note : "",
      }));
    return { found: parsed.found && excerpts.length > 0, excerpts };
  } catch {
    return { found: false, excerpts: [] };
  }
}
