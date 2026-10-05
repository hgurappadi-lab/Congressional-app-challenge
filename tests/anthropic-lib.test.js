import { describe, expect, it } from "vitest";
import { extractTextBlock } from "../src/app/api/_lib/anthropic";

describe("extractTextBlock", () => {
  it("returns the text block when it's the only block", () => {
    expect(extractTextBlock([{ type: "text", text: "hello" }])).toBe("hello");
  });

  it("finds the text block even when a thinking block comes first (extended thinking)", () => {
    const content = [
      { type: "thinking", thinking: "reasoning...", signature: "x" },
      { type: "text", text: "the actual answer" },
    ];
    expect(extractTextBlock(content)).toBe("the actual answer");
  });

  it("returns an empty string when there is no text block at all", () => {
    expect(extractTextBlock([{ type: "thinking", thinking: "x", signature: "y" }])).toBe("");
  });

  it("returns an empty string for missing/empty content", () => {
    expect(extractTextBlock(undefined)).toBe("");
    expect(extractTextBlock([])).toBe("");
  });
});
