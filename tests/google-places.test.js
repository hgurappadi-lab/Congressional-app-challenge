import { describe, expect, it } from "vitest";
import {
  buildNearbySearchBody,
  buildTextSearchBody,
  parsePlacesCandidates,
} from "../src/lib/google-places";

describe("buildNearbySearchBody", () => {
  it("converts miles to meters and includes the target types", () => {
    const body = buildNearbySearchBody(32.967, -117.1717, 1);
    expect(body.locationRestriction.circle.radius).toBe(1609);
    expect(body.locationRestriction.circle.center).toEqual({
      latitude: 32.967,
      longitude: -117.1717,
    });
    expect(body.includedTypes).toEqual(["restaurant", "cafe", "fast_food_restaurant"]);
  });

  it("caps the radius at the API's own 50km max even for a large request", () => {
    const body = buildNearbySearchBody(32.967, -117.1717, 100);
    expect(body.locationRestriction.circle.radius).toBe(50000);
  });

  it("caps maxResultCount at the API's own limit of 20", () => {
    const body = buildNearbySearchBody(32.967, -117.1717, 15);
    expect(body.maxResultCount).toBe(20);
  });
});

describe("buildTextSearchBody", () => {
  it("folds the craving into a textQuery and uses locationBias, not locationRestriction", () => {
    const body = buildTextSearchBody("pizza", 32.967, -117.1717, 10);
    expect(body.textQuery).toBe("pizza restaurant");
    expect(body.locationBias.circle.radius).toBe(16093);
    expect(body.locationBias.circle.center).toEqual({ latitude: 32.967, longitude: -117.1717 });
    expect(body.locationRestriction).toBeUndefined();
  });

  it("caps the radius and result count the same way as Nearby Search", () => {
    const body = buildTextSearchBody("tacos", 32.967, -117.1717, 100);
    expect(body.locationBias.circle.radius).toBe(50000);
    expect(body.maxResultCount).toBe(20);
  });
});

describe("parsePlacesCandidates", () => {
  it("skips places with no displayName", () => {
    const body = { places: [{ location: { latitude: 1, longitude: 2 } }] };
    expect(parsePlacesCandidates(body)).toEqual([]);
  });

  it("extracts name, cuisine, address, website, coordinates, and a Maps link", () => {
    const body = {
      places: [
        {
          displayName: { text: "Test Cafe" },
          formattedAddress: "123 Main St, San Diego, CA",
          location: { latitude: 32.9, longitude: -117.1 },
          websiteUri: "https://testcafe.example.com",
          googleMapsUri: "https://maps.google.com/?cid=12345",
          primaryTypeDisplayName: { text: "Cafe" },
        },
      ],
    };
    expect(parsePlacesCandidates(body)).toEqual([
      {
        name: "Test Cafe",
        cuisine: "Cafe",
        address: "123 Main St, San Diego, CA",
        website: "https://testcafe.example.com",
        lat: 32.9,
        lng: -117.1,
        mapsUrl: "https://maps.google.com/?cid=12345",
      },
    ]);
  });

  it("falls back to null cuisine/address/website/mapsUrl when fields are missing", () => {
    const body = { places: [{ displayName: { text: "No Frills" }, location: { latitude: 1, longitude: 2 } }] };
    const [candidate] = parsePlacesCandidates(body);
    expect(candidate.cuisine).toBeNull();
    expect(candidate.address).toBeNull();
    expect(candidate.website).toBeNull();
    expect(candidate.mapsUrl).toBeNull();
  });

  it("handles a missing places array", () => {
    expect(parsePlacesCandidates({})).toEqual([]);
  });
});
