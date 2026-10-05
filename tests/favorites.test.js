import { describe, expect, it } from "vitest";
import {
  addFavoriteEntry,
  removeFavoriteEntry,
  isFavoriteEntry,
  DEFAULT_LIST_NAME,
} from "../src/lib/favorites";

describe("addFavoriteEntry", () => {
  it("appends a new entry, defaulting listName", () => {
    const result = addFavoriteEntry([], { targetType: "restaurant", targetId: "r1" });
    expect(result).toEqual([
      expect.objectContaining({
        targetType: "restaurant",
        targetId: "r1",
        listName: DEFAULT_LIST_NAME,
      }),
    ]);
  });

  it("is idempotent — adding an exact duplicate is a no-op", () => {
    const entries = addFavoriteEntry([], { targetType: "dish", targetId: "d1" });
    const result = addFavoriteEntry(entries, { targetType: "dish", targetId: "d1" });
    expect(result).toEqual(entries);
    expect(result).toHaveLength(1);
  });

  it("allows the same target under a different listName", () => {
    const entries = addFavoriteEntry([], { targetType: "dish", targetId: "d1" });
    const result = addFavoriteEntry(entries, {
      targetType: "dish",
      targetId: "d1",
      listName: "Try Later",
    });
    expect(result).toHaveLength(2);
  });
});

describe("removeFavoriteEntry", () => {
  it("removes a matching entry", () => {
    const entries = addFavoriteEntry([], { targetType: "restaurant", targetId: "r1" });
    const result = removeFavoriteEntry(entries, { targetType: "restaurant", targetId: "r1" });
    expect(result).toEqual([]);
  });

  it("is a no-op when the entry isn't present", () => {
    const entries = addFavoriteEntry([], { targetType: "restaurant", targetId: "r1" });
    const result = removeFavoriteEntry(entries, { targetType: "restaurant", targetId: "r2" });
    expect(result).toEqual(entries);
  });

  it("only removes the matching listName, not other lists for the same target", () => {
    let entries = addFavoriteEntry([], { targetType: "dish", targetId: "d1" });
    entries = addFavoriteEntry(entries, {
      targetType: "dish",
      targetId: "d1",
      listName: "Try Later",
    });
    const result = removeFavoriteEntry(entries, { targetType: "dish", targetId: "d1" });
    expect(result).toEqual([
      expect.objectContaining({ targetType: "dish", targetId: "d1", listName: "Try Later" }),
    ]);
  });
});

describe("isFavoriteEntry", () => {
  it("is true when present and false when absent or under a different listName", () => {
    const entries = addFavoriteEntry([], { targetType: "restaurant", targetId: "r1" });
    expect(isFavoriteEntry(entries, { targetType: "restaurant", targetId: "r1" })).toBe(true);
    expect(isFavoriteEntry(entries, { targetType: "restaurant", targetId: "r2" })).toBe(false);
    expect(
      isFavoriteEntry(entries, {
        targetType: "restaurant",
        targetId: "r1",
        listName: "Try Later",
      }),
    ).toBe(false);
  });
});
