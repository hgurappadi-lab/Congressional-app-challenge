// Deterministic craving search (build plan §15) — text normalization,
// synonym expansion, and trigram-style fuzzy similarity, entirely in JS
// against an already-fetched list of menu items. No live AI call and no
// per-query database round trip: given the dataset's prototype scale, this
// mirrors what a Postgres trigram/full-text query would do, while staying
// a pure, unit-testable function like the rest of /lib.

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents (e.g. Peñasquitos -> Penasquitos)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set(["a", "an", "the", "with", "and", "of", "some", "for"]);

function tokenize(normalized) {
  return normalized.split(" ").filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

// Trigram sets + Jaccard similarity, the same idea behind Postgres'
// pg_trgm `similarity()` (which the schema already indexes menu_items.name
// and .description for) — approximated here in JS so it stays testable
// and doesn't need a per-keystroke database round trip.
function trigrams(str) {
  const padded = `  ${str} `;
  const grams = new Set();
  for (let i = 0; i < padded.length - 2; i++) {
    grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

export function trigramSimilarity(a, b) {
  if (!a || !b) return 0;
  const gramsA = trigrams(a);
  const gramsB = trigrams(b);
  if (gramsA.size === 0 || gramsB.size === 0) return 0;

  let intersection = 0;
  for (const gram of gramsA) {
    if (gramsB.has(gram)) intersection++;
  }
  return intersection / (gramsA.size + gramsB.size - intersection);
}

// Groups of interchangeable craving terms. Deliberately not exhaustive —
// covers common cravings for the cuisines in the curated dataset. A term
// not in any group still matches fine via direct substring/token overlap
// and trigram similarity; this only adds extra recall for near-synonyms
// (e.g. "bbq" surfacing a "bulgogi" dish that never says "bbq").
const SYNONYM_GROUPS = [
  ["fried rice", "rice"],
  ["noodles", "noodle", "pad see ew", "chow mein", "lo mein", "pad thai"],
  ["pizza"],
  ["burger", "cheeseburger"],
  ["taco", "burrito"],
  ["curry", "masala", "tikka masala"],
  ["sushi", "roll", "sashimi"],
  ["bbq", "barbecue", "grill", "bulgogi", "korean bbq"],
  ["salad"],
  ["soup", "pho", "ramen", "chowder"],
  ["biryani", "pulao"],
  ["kebab", "tikka", "skewer"],
  ["vegan", "plant based", "plant-based"],
  ["gluten free", "gluten-free"],
  ["shake", "milkshake"],
];

// Given a normalized query, returns extra phrases worth matching against —
// every other term in any synonym group the query touches.
function expandQuery(normalizedQuery) {
  const expansions = new Set();
  for (const group of SYNONYM_GROUPS) {
    const touches = group.some((term) => normalizedQuery.includes(term));
    if (touches) {
      for (const term of group) expansions.add(term);
    }
  }
  return [...expansions];
}

const WEIGHTS = {
  exactNameMatch: 0.6,
  exactHaystackMatch: 0.3,
  tokenOverlap: 0.3,
  synonymMatch: 0.2,
  trigram: 0.15,
};

// searchMenuItems(query, items) — items: [{ id, name, description,
// category, ... }]. Returns items scoring above `minScore`, each with an
// added `relevance` (0–1), sorted by relevance descending. Every other
// field on the input item is passed through untouched.
export function searchMenuItems(query, items, { minScore = 0.1 } = {}) {
  const normalizedQuery = normalizeText(query || "");
  if (!normalizedQuery) return [];

  const queryTokens = tokenize(normalizedQuery);
  const expansionPhrases = expandQuery(normalizedQuery);

  const scored = items.map((item) => {
    const nameNorm = normalizeText(item.name || "");
    const descNorm = normalizeText(item.description || "");
    const categoryNorm = normalizeText(item.category || "");
    const haystack = `${nameNorm} ${descNorm} ${categoryNorm}`;

    let score = 0;

    if (nameNorm.includes(normalizedQuery)) {
      score += WEIGHTS.exactNameMatch;
    } else if (haystack.includes(normalizedQuery)) {
      score += WEIGHTS.exactHaystackMatch;
    }

    if (queryTokens.length > 0) {
      const matched = queryTokens.filter((token) => haystack.includes(token));
      score += WEIGHTS.tokenOverlap * (matched.length / queryTokens.length);
    }

    if (expansionPhrases.some((phrase) => haystack.includes(phrase))) {
      score += WEIGHTS.synonymMatch;
    }

    score += WEIGHTS.trigram * trigramSimilarity(normalizedQuery, nameNorm);

    return { item, score: Math.min(score, 1) };
  });

  return scored
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, relevance: Math.round(score * 100) / 100 }));
}

export { normalizeText };
