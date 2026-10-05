import { lookup as dnsLookup } from "node:dns/promises";
import { isAllowedProtocol, isPrivateOrLoopbackIp } from "@/lib/website-extraction";

// Shared server-only fetch guard used by every route that fetches a
// restaurant's own website (currently /api/website-lookup and
// /api/ai-recommend). Lives under a "_"-prefixed folder so it's excluded
// from routing, same as _lib/restaurants.js — a data-access helper, not a
// route handler. A restaurant's `website` tag comes from untrusted,
// community-sourced OpenStreetMap data, so every fetch target here must be
// validated, not assumed safe.
const FETCH_TIMEOUT_MS = 8000;
const DNS_TIMEOUT_MS = 4000;
const MAX_RESPONSE_BYTES = 500_000;
const MAX_REDIRECTS = 3;

export function rejectedUrlError() {
  const err = new Error("That URL isn't allowed.");
  err.status = 400;
  return err;
}

// dns.promises.lookup has no built-in timeout/abort support — an
// unresponsive or slow-resolving hostname would otherwise hang this (and
// anything awaiting it, e.g. a Promise.allSettled batch) indefinitely.
// Exported so callers doing several fetches in parallel (e.g.
// /api/ai-recommend) can put a hard overall cap on each one, on top of
// this module's own per-step timeouts.
export function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function assertSafeToFetch(urlString) {
  if (!isAllowedProtocol(urlString)) {
    throw rejectedUrlError();
  }
  const hostname = new URL(urlString).hostname;
  if (hostname === "localhost") {
    throw rejectedUrlError();
  }
  const addresses = await withTimeout(
    dnsLookup(hostname, { all: true }),
    DNS_TIMEOUT_MS,
    "That website couldn't be resolved in time.",
  );
  if (addresses.some((a) => isPrivateOrLoopbackIp(a.address))) {
    throw rejectedUrlError();
  }
}

// Fetches `url` as text, following redirects manually (re-validating each
// hop against assertSafeToFetch) and capping response size — a restaurant
// site is untrusted content, not something to trust blindly.
export async function fetchTextCapped(url) {
  let currentUrl = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeToFetch(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "clearplate-website-lookup/1.0" },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      currentUrl = new URL(response.headers.get("location"), currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`The restaurant's website returned an error (${response.status}).`);
    }

    const reader = response.body?.getReader();
    if (!reader) return await response.text();

    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (received > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  }
  throw new Error("Too many redirects following that URL.");
}
