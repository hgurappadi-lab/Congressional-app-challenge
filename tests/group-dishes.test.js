import { describe, expect, it } from "vitest";
import { groupDishesByCategory } from "../src/lib/group-dishes";

describe("groupDishesByCategory", () => {
  it("preserves first-seen category order and groups repeated categories together", () => {
    const dishes = [
      { id: "1", category: "Entrees" },
      { id: "2", category: "Appetizers" },
      { id: "3", category: "Entrees" },
    ];

    const grouped = groupDishesByCategory(dishes);

    expect(grouped.map((g) => g.category)).toEqual(["Entrees", "Appetizers"]);
    expect(grouped[0].dishes.map((d) => d.id)).toEqual(["1", "3"]);
    expect(grouped[1].dishes.map((d) => d.id)).toEqual(["2"]);
  });

  it("buckets missing, empty, or whitespace-only categories under 'Other'", () => {
    const dishes = [
      { id: "1", category: null },
      { id: "2", category: "" },
      { id: "3", category: "   " },
      { id: "4", category: "Entrees" },
    ];

    const grouped = groupDishesByCategory(dishes);

    expect(grouped.map((g) => g.category)).toEqual(["Other", "Entrees"]);
    expect(grouped[0].dishes.map((d) => d.id)).toEqual(["1", "2", "3"]);
  });

  it("returns an empty array for an empty input", () => {
    expect(groupDishesByCategory([])).toEqual([]);
  });
});
