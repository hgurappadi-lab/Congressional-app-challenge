import { describe, expect, it } from "vitest";
import { searchMenuItems, trigramSimilarity, normalizeText } from "../src/lib/search";

const ITEMS = [
  {
    id: "1",
    name: "House Special Fried Rice",
    description: "Wok-fried rice with mixed protein and vegetables.",
    category: "rice",
  },
  {
    id: "2",
    name: "Spicy Lamb + Avocado Bowl",
    description: "Braised lamb, avocado, over greens with Crazy Feta and Strawberry Sesame dressing.",
    category: "bowl",
  },
  {
    id: "3",
    name: "Bulgogi (Marinated Beef)",
    description: "Thin-sliced beef marinated Korean-BBQ style, grilled tableside.",
    category: "bbq",
  },
  {
    id: "4",
    name: "Classic Grilled Cheese",
    description: "Grilled cheese sandwich on white bread.",
    category: "sandwich",
  },
  {
    id: "5",
    name: "Vanilla Shake",
    description: "In-N-Out's classic vanilla milkshake.",
    category: "shake",
  },
];

describe("normalizeText", () => {
  it("lowercases, strips punctuation and accents, and collapses whitespace", () => {
    expect(normalizeText("Spicy Fried-Rice!")).toBe("spicy fried rice");
    expect(normalizeText("Peñasquitos")).toBe("penasquitos");
    expect(normalizeText("  multiple   spaces  ")).toBe("multiple spaces");
  });
});

describe("trigramSimilarity", () => {
  it("is 1 for identical strings and 0 for completely unrelated ones", () => {
    expect(trigramSimilarity("fried rice", "fried rice")).toBe(1);
    expect(trigramSimilarity("fried rice", "xyz")).toBe(0);
  });

  it("is higher for more similar strings", () => {
    const close = trigramSimilarity("fried rice", "fried rise");
    const far = trigramSimilarity("fried rice", "grilled cheese");
    expect(close).toBeGreaterThan(far);
  });
});

describe("searchMenuItems", () => {
  it("ranks an exact name match highest", () => {
    const results = searchMenuItems("fried rice", ITEMS);
    expect(results[0].id).toBe("1");
  });

  it("matches 'spicy fried rice' against the fried rice dish even though the item name doesn't say spicy", () => {
    const results = searchMenuItems("spicy fried rice", ITEMS);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("1");
  });

  it("expands synonyms so 'bbq' surfaces a bulgogi dish that never says bbq", () => {
    const results = searchMenuItems("bbq", ITEMS);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("3");
  });

  it("expands synonyms so 'milkshake' surfaces an item named Shake", () => {
    const results = searchMenuItems("milkshake", ITEMS);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("5");
  });

  it("returns no results for a completely unrelated query", () => {
    const results = searchMenuItems("underwater basket weaving", ITEMS);
    expect(results).toHaveLength(0);
  });

  it("returns an empty array for an empty query instead of matching everything", () => {
    expect(searchMenuItems("", ITEMS)).toEqual([]);
    expect(searchMenuItems("   ", ITEMS)).toEqual([]);
  });

  it("is case- and punctuation-insensitive", () => {
    const a = searchMenuItems("FRIED RICE!!", ITEMS);
    const b = searchMenuItems("fried rice", ITEMS);
    expect(a.map((r) => r.id)).toEqual(b.map((r) => r.id));
  });

  it("attaches a relevance score and sorts results by it descending", () => {
    const results = searchMenuItems("grilled", ITEMS);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) expect(typeof r.relevance).toBe("number");
    const scores = results.map((r) => r.relevance);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("passes through the original item fields unchanged", () => {
    const results = searchMenuItems("fried rice", ITEMS);
    expect(results[0].name).toBe("House Special Fried Rice");
    expect(results[0].category).toBe("rice");
  });
});
