import { describe, expect, it } from "vitest";
import {
  isAllowedProtocol,
  isPrivateOrLoopbackIp,
  stripHtmlToText,
  truncateForPrompt,
  buildExtractionMessages,
  parseExtractionResponse,
} from "../src/lib/website-extraction";

describe("isAllowedProtocol", () => {
  it("allows http and https", () => {
    expect(isAllowedProtocol("https://example.com")).toBe(true);
    expect(isAllowedProtocol("http://example.com")).toBe(true);
  });

  it("rejects other protocols and invalid URLs", () => {
    expect(isAllowedProtocol("ftp://example.com")).toBe(false);
    expect(isAllowedProtocol("file:///etc/passwd")).toBe(false);
    expect(isAllowedProtocol("not a url")).toBe(false);
  });
});

describe("isPrivateOrLoopbackIp", () => {
  it("flags loopback, private, and link-local/metadata IPv4 ranges", () => {
    expect(isPrivateOrLoopbackIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrLoopbackIp("10.1.2.3")).toBe(true);
    expect(isPrivateOrLoopbackIp("172.16.0.5")).toBe(true);
    expect(isPrivateOrLoopbackIp("172.31.255.255")).toBe(true);
    expect(isPrivateOrLoopbackIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrLoopbackIp("169.254.169.254")).toBe(true); // cloud metadata
    expect(isPrivateOrLoopbackIp("0.0.0.0")).toBe(true);
  });

  it("allows ordinary public IPv4 addresses", () => {
    expect(isPrivateOrLoopbackIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrLoopbackIp("172.15.0.1")).toBe(false); // just outside 172.16/12
    expect(isPrivateOrLoopbackIp("172.32.0.1")).toBe(false);
  });

  it("flags loopback and unique-local IPv6 addresses", () => {
    expect(isPrivateOrLoopbackIp("::1")).toBe(true);
    expect(isPrivateOrLoopbackIp("fd00::1")).toBe(true);
    expect(isPrivateOrLoopbackIp("fe80::1")).toBe(true);
    expect(isPrivateOrLoopbackIp("::ffff:127.0.0.1")).toBe(true);
  });

  it("allows an ordinary public IPv6 address", () => {
    expect(isPrivateOrLoopbackIp("2001:4860:4860::8888")).toBe(false);
  });
});

describe("stripHtmlToText", () => {
  it("removes tags, scripts, and styles, and collapses whitespace", () => {
    const html = `
      <html><head><style>.a{color:red}</style></head>
      <body><script>alert(1)</script>
        <p>Contains  <b>peanuts</b>   and\n\ntree nuts.</p>
      </body></html>
    `;
    expect(stripHtmlToText(html)).toBe("Contains peanuts and tree nuts.");
  });

  it("decodes common HTML entities", () => {
    expect(stripHtmlToText("<p>Fish &amp; Chips &quot;ok&quot;</p>")).toBe(
      'Fish & Chips "ok"',
    );
  });
});

describe("truncateForPrompt", () => {
  it("leaves short text untouched", () => {
    expect(truncateForPrompt("short", 100)).toBe("short");
  });

  it("truncates long text and adds an ellipsis", () => {
    const result = truncateForPrompt("a".repeat(50), 10);
    expect(result).toBe(`${"a".repeat(10)}…`);
  });
});

describe("buildExtractionMessages", () => {
  it("includes the restaurant name and page text, and instructs quote-only extraction", () => {
    const { system, user } = buildExtractionMessages("Test Cafe", "Contains peanuts.");
    expect(system).toMatch(/never infer/i);
    expect(user).toContain("Test Cafe");
    expect(user).toContain("Contains peanuts.");
  });

  it("folds an optional craving into the system prompt without changing the user message", () => {
    const { system, user } = buildExtractionMessages("Test Cafe", "Contains peanuts.", "tacos");
    expect(system).toMatch(/"tacos"/);
    expect(user).not.toContain("tacos");
  });

  it("omits any craving instruction when none is given", () => {
    const { system } = buildExtractionMessages("Test Cafe", "Contains peanuts.");
    expect(system).not.toMatch(/Also look for/i);
  });
});

describe("parseExtractionResponse", () => {
  it("parses a well-formed found response", () => {
    const raw = JSON.stringify({
      found: true,
      excerpts: [{ quote: "Contains peanuts", note: "Listed under allergens." }],
    });
    expect(parseExtractionResponse(raw)).toEqual({
      found: true,
      excerpts: [{ quote: "Contains peanuts", note: "Listed under allergens." }],
    });
  });

  it("treats found:true with no excerpts as not found", () => {
    const raw = JSON.stringify({ found: true, excerpts: [] });
    expect(parseExtractionResponse(raw)).toEqual({ found: false, excerpts: [] });
  });

  it("degrades malformed JSON to an honest not-found result", () => {
    expect(parseExtractionResponse("not json")).toEqual({ found: false, excerpts: [] });
  });

  it("strips a ```json code fence before parsing (Claude sometimes adds one despite instructions)", () => {
    const raw =
      '```json\n{"found": true, "excerpts": [{"quote": "Contains peanuts", "note": "x"}]}\n```';
    expect(parseExtractionResponse(raw)).toEqual({
      found: true,
      excerpts: [{ quote: "Contains peanuts", note: "x" }],
    });
  });

  it("strips a bare ``` fence with no language tag", () => {
    const raw = '```\n{"found": true, "excerpts": [{"quote": "Contains peanuts", "note": ""}]}\n```';
    expect(parseExtractionResponse(raw)).toEqual({
      found: true,
      excerpts: [{ quote: "Contains peanuts", note: "" }],
    });
  });

  it("degrades an unexpected shape to not-found", () => {
    expect(parseExtractionResponse(JSON.stringify({ hello: "world" }))).toEqual({
      found: false,
      excerpts: [],
    });
  });

  it("drops excerpts with an empty or missing quote", () => {
    const raw = JSON.stringify({
      found: true,
      excerpts: [{ quote: "  ", note: "x" }, { note: "no quote field" }],
    });
    expect(parseExtractionResponse(raw)).toEqual({ found: false, excerpts: [] });
  });
});
