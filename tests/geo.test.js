import { describe, expect, it } from "vitest";
import { haversineDistanceMiles } from "../src/lib/geo";

describe("haversineDistanceMiles", () => {
  it("returns 0 for the same point", () => {
    const point = { lat: 32.967, lng: -117.1717 };
    expect(haversineDistanceMiles(point, point)).toBeCloseTo(0, 5);
  });

  it("is symmetric", () => {
    const a = { lat: 32.967, lng: -117.1717 };
    const b = { lat: 33.049, lng: -117.2604 };
    expect(haversineDistanceMiles(a, b)).toBeCloseTo(haversineDistanceMiles(b, a), 8);
  });

  it("is approximately 69 miles per degree of latitude", () => {
    const a = { lat: 32.0, lng: -117.0 };
    const b = { lat: 33.0, lng: -117.0 };
    expect(haversineDistanceMiles(a, b)).toBeCloseTo(69.0, 0);
  });

  it("is approximately 69.17 miles per degree of longitude at the equator", () => {
    const a = { lat: 0, lng: -117.0 };
    const b = { lat: 0, lng: -116.0 };
    expect(haversineDistanceMiles(a, b)).toBeCloseTo(69.17, 0);
  });
});
