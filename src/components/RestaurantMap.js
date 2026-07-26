"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Simple filled-pin marker in the app's primary green, built as an inline
// SVG data icon — avoids Leaflet's default marker image assets, which
// don't resolve correctly under Next.js/Turbopack bundling without extra
// webpack config.
const PIN_SVG = `
  <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22c0-7.73-6.27-14-14-14z" fill="#166534"/>
    <circle cx="14" cy="14" r="5.5" fill="#ffffff"/>
  </svg>
`;

// Renders a live OpenStreetMap (via Leaflet) centered on `center` with a
// marker per restaurant, per plan §6 (client-side rendering only — no
// restaurant data is fetched from a map provider, only displayed on top of
// its tiles). Free and API-key-free: OpenStreetMap's tile usage policy only
// requires the on-map attribution Leaflet already shows by default.
export default function RestaurantMap({ center, restaurants, onSelectRestaurant }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const resizeObserverRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then((leaflet) => {
      const L = leaflet.default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      mapRef.current = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: 12,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
      setMapReady(true);

      // General safety net for legitimate container-size changes (browser
      // window resize, device rotation) — the parent only mounts this
      // component once its container is already visible/correctly sized
      // (see MapPageClient), so this isn't compensating for a hidden mount.
      resizeObserverRef.current = new ResizeObserver(() => {
        mapRef.current?.invalidateSize();
      });
      resizeObserverRef.current.observe(containerRef.current);
    });

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([center.lat, center.lng]);
    }
  }, [center]);

  useEffect(() => {
    const L = leafletRef.current;
    if (!mapReady || !mapRef.current || !L) return;

    for (const marker of markersRef.current) marker.remove();
    const icon = L.divIcon({
      html: PIN_SVG,
      className: "",
      iconSize: [28, 36],
      iconAnchor: [14, 36],
    });
    markersRef.current = restaurants.map((restaurant) => {
      const marker = L.marker([restaurant.latitude, restaurant.longitude], {
        icon,
        title: `${restaurant.name} — score ${restaurant.score}`,
      }).addTo(mapRef.current);
      if (onSelectRestaurant) {
        marker.on("click", () => onSelectRestaurant(restaurant));
      }
      return marker;
    });

    // A fixed zoom level doesn't guarantee every marker actually fits in
    // view — restaurants can be spread out more than a short mobile map
    // height (or a tight desktop zoom) can show at once. Fit the view to
    // whatever markers currently exist instead, so nothing renders outside
    // the visible area. Falls back to just centering when there are none.
    if (restaurants.length > 0) {
      const bounds = L.latLngBounds(
        restaurants.map((r) => [r.latitude, r.longitude]),
      );
      mapRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
    } else {
      mapRef.current.setView([center.lat, center.lng], 12);
    }

    return () => {
      for (const marker of markersRef.current) marker.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, mapReady]);

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-2xl lg:h-full lg:min-h-[500px]"
    />
  );
}
