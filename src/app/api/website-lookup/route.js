import { fetchTextCapped } from "../_lib/safe-fetch";
import { callAnthropic } from "../_lib/anthropic";
import {
  stripHtmlToText,
  buildExtractionMessages,
  parseExtractionResponse,
} from "@/lib/website-extraction";

// POST /api/website-lookup
// Body: { url, restaurantName, craving? }
//
// On-demand only — triggered by one user click on one specific restaurant,
// never run automatically over a list. Fetches that restaurant's own
// website, asks Claude to quote (never infer) any allergen/menu text it
// contains, and returns that as an unverified, labeled result. This never
// writes to Supabase, never gets a score, and is unrelated to the curated
// dataset's classification/scoring pipeline — see LIMITATIONS.md. The
// optional `craving` folds a specific dish into the same one-restaurant
// read (Find a Dish reuses this route) — restaurant selection itself stays
// deterministic/human-driven everywhere; AI is never used to pick or rank
// which restaurant to look at, only to read the one a human already chose.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { url, restaurantName, craving } = body ?? {};
  if (typeof url !== "string" || url.trim().length === 0) {
    return Response.json({ error: "url is required." }, { status: 400 });
  }

  let html;
  try {
    html = await fetchTextCapped(url);
  } catch (err) {
    return Response.json(
      { error: err.message || "Couldn't reach that website." },
      { status: err.status || 502 },
    );
  }

  const pageText = stripHtmlToText(html);
  const { system, user } = buildExtractionMessages(
    restaurantName || "this restaurant",
    pageText,
    typeof craving === "string" && craving.trim().length > 0 ? craving.trim() : undefined,
  );

  let rawText;
  try {
    rawText = await callAnthropic({ system, user, maxTokens: 1024 });
  } catch (err) {
    return Response.json(
      { error: err.message || "The AI lookup service is unavailable right now." },
      { status: err.status || 502 },
    );
  }

  const { found, excerpts } = parseExtractionResponse(rawText);
  return Response.json({ found, excerpts, sourceUrl: url });
}
