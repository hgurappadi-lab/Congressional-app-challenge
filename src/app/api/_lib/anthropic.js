// Shared Anthropic Messages API caller for /api/website-lookup and
// /api/ai-recommend — both server-side, on-demand only, both feeding
// their result through a strict quote-grounded parser before it ever
// reaches the client. See LIMITATIONS.md's "Two trust tiers" for why
// nothing built on top of this ever produces a score or verdict.
const ANTHROPIC_MODEL = "claude-sonnet-5";

// Claude sometimes emits a "thinking" content block before the actual
// "text" block (extended thinking) — content[0] isn't reliably the
// answer, so find the text block explicitly rather than assuming index 0.
// Exported (pure, no I/O) so this exact bug shape is regression-tested.
export function extractTextBlock(content) {
  return content?.find((block) => block.type === "text")?.text ?? "";
}

// Returns the raw text of Claude's reply, or throws if the call fails.
// Callers are responsible for parsing/validating that text themselves.
export async function callAnthropic({ system, user, maxTokens }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error("AI features aren't configured (missing ANTHROPIC_API_KEY).");
    err.status = 503;
    throw err;
  }

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        // Only identity-linked (Personal) keys need this; harmless to omit
        // for a workspace-scoped key, so send it whenever it's configured.
        ...(process.env.ANTHROPIC_WORKSPACE_ID
          ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
          : {}),
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch {
    const err = new Error("The AI lookup service is unavailable right now.");
    err.status = 502;
    throw err;
  }

  if (!response.ok) {
    const err = new Error("The AI lookup service is unavailable right now.");
    err.status = 502;
    throw err;
  }

  const body = await response.json();
  return extractTextBlock(body.content);
}
