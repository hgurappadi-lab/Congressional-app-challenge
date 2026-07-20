"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let loaderPromise = null;

// Google Maps' loader is meant to be called once per page — reuse a single
// in-flight/resolved promise across every mount of this component instead
// of re-requesting the script.
function loadGoogleMaps() {
  if (!loaderPromise) {
    const loader = new Loader({ apiKey: API_KEY, version: "weekly" });
    loaderPromise = loader.importLibrary("maps");
  }
  return loaderPromise;
}

// Renders a live Google Map centered on `center` with a marker per
// restaurant, per plan §6 (client-side rendering only — no restaurant data
// is fetched from Google, only displayed on top of Google's map tiles).
// If no API key is configured, this renders a plain-text fallback instead
// of failing silently — the ranked list above/below it still works either
// way, so a missing key never blocks using the app.
export default function RestaurantMap({ center, restaurants }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!API_KEY) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(({ Map }) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new Map(containerRef.current, {
          center,
          zoom: 12,
          mapId: "explore-nearby",
        });
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter(center);
    }
  }, [center]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    for (const marker of markersRef.current) marker.setMap(null);
    markersRef.current = restaurants.map((restaurant) => {
      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position: { lat: restaurant.latitude, lng: restaurant.longitude },
        title: `${restaurant.name} — score ${restaurant.score}`,
      });
      return marker;
    });

    return () => {
      for (const marker of markersRef.current) marker.setMap(null);
    };
  }, [restaurants]);

  if (!API_KEY) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-zinc-300 px-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-500">
        <p>Interactive map unavailable — no Google Maps API key configured.</p>
        <p className="text-xs">Results are still ranked in the list below.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-red-300 px-4 text-center text-sm text-red-600 dark:border-red-800 dark:text-red-400">
        <p>Map failed to load: {loadError}</p>
        <p className="text-xs">Results are still ranked in the list below.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="h-64 w-full rounded-md" />;
}
