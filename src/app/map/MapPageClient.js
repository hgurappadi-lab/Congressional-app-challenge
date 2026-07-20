"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadGuestProfile, loadUserProfile } from "@/lib/profile";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import RestaurantMap from "@/components/RestaurantMap";
import { CLASSIFICATION_LABELS } from "@/lib/classification-labels";

const RADIUS_OPTIONS_MILES = [1, 3, 5, 10, 15];
const SEARCH_DEBOUNCE_MS = 400;

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(
    searchParams.get("mode") === "find-dish" ? "find-dish" : "explore",
  ); // "explore" | "find-dish"
  const [profile, setProfile] = useState(null);

  const [locationSource, setLocationSource] = useState("neighborhood"); // "geolocation" | "neighborhood"
  const [neighborhoodId, setNeighborhoodId] = useState(NEIGHBORHOODS[0].id);
  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(5);

  const [craving, setCraving] = useState("");
  const [restaurantResults, setRestaurantResults] = useState(null);
  const [dishResults, setDishResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the guest or signed-in profile once on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (user) {
        try {
          const loaded = await loadUserProfile(supabase, user.id);
          if (!cancelled) setProfile(loaded);
        } catch {
          if (!cancelled) setProfile(loadGuestProfile());
        }
      } else {
        setProfile(loadGuestProfile());
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function useMyLocation() {
    setLocationError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation isn't available in this browser. Choose a neighborhood instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationSource("geolocation");
      },
      () => {
        setLocationError(
          "Location permission was denied or unavailable. Choose a neighborhood instead.",
        );
        setLocationSource("neighborhood");
      },
    );
  }

  const activeCoords =
    locationSource === "geolocation" && coords
      ? coords
      : (() => {
          const neighborhood = NEIGHBORHOODS.find((n) => n.id === neighborhoodId);
          return { lat: neighborhood.lat, lng: neighborhood.lng };
        })();

  // Explore Nearby: fetch ranked restaurants whenever the profile,
  // location, or radius changes.
  useEffect(() => {
    if (!profile || mode !== "explore") return;

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/rank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: activeCoords.lat,
            lng: activeCoords.lng,
            radiusMiles,
            allergies: profile.allergies,
            dietaryRestrictions: profile.dietary_restrictions,
            matchingStrictness: profile.matching_strictness,
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${response.status}).`);
        }
        const body = await response.json();
        if (!cancelled) setRestaurantResults(body.restaurants);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [profile, mode, activeCoords.lat, activeCoords.lng, radiusMiles]);

  // Find a Dish: search a craving, debounced, whenever the profile,
  // craving text, location, or radius changes.
  useEffect(() => {
    if (!profile || mode !== "find-dish" || craving.trim().length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: craving,
            lat: activeCoords.lat,
            lng: activeCoords.lng,
            radiusMiles,
            allergies: profile.allergies,
            dietaryRestrictions: profile.dietary_restrictions,
            matchingStrictness: profile.matching_strictness,
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${response.status}).`);
        }
        const body = await response.json();
        if (!cancelled) setDishResults(body.dishes);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [profile, mode, craving, activeCoords.lat, activeCoords.lng, radiusMiles]);

  // An empty craving always means "no results to show," regardless of
  // whatever the last non-empty search happened to return.
  const effectiveDishResults = craving.trim().length === 0 ? null : dishResults;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {mode === "explore" ? "Explore Nearby" : "Find a Dish"}
        </h1>
        <Link href="/home" className="text-sm underline">
          Back
        </Link>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("explore")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "explore"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "border border-zinc-300 dark:border-zinc-700"
          }`}
        >
          Explore Nearby
        </button>
        <button
          type="button"
          onClick={() => setMode("find-dish")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "find-dish"
              ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
              : "border border-zinc-300 dark:border-zinc-700"
          }`}
        >
          Find a Dish
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        {mode === "find-dish" ? (
          <input
            type="text"
            value={craving}
            onChange={(event) => setCraving(event.target.value)}
            placeholder="What are you craving? e.g. spicy fried rice"
            className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
          >
            Use my location
          </button>

          <label className="flex items-center gap-2 text-sm">
            or pick a neighborhood
            <select
              value={neighborhoodId}
              onChange={(event) => {
                setNeighborhoodId(event.target.value);
                setLocationSource("neighborhood");
              }}
              className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
            >
              {NEIGHBORHOODS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            within
            <select
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(Number(event.target.value))}
              className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 dark:border-zinc-700"
            >
              {RADIUS_OPTIONS_MILES.map((mi) => (
                <option key={mi} value={mi}>
                  {mi} mi
                </option>
              ))}
            </select>
          </label>
        </div>

        {locationError ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">{locationError}</p>
        ) : null}
      </div>

      {mode === "explore" ? (
        <RestaurantMap center={activeCoords} restaurants={restaurantResults ?? []} />
      ) : null}

      {loading ? <p className="text-sm text-zinc-500">Searching…</p> : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {mode === "find-dish" && craving.trim().length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Type a craving above to search dishes within {radiusMiles} miles.
        </p>
      ) : null}

      {mode === "explore" && !loading && restaurantResults && restaurantResults.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No restaurants found within {radiusMiles} miles. Try a larger radius.
        </p>
      ) : null}

      {mode === "find-dish" && !loading && effectiveDishResults && effectiveDishResults.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No dishes matched &ldquo;{craving}&rdquo; within {radiusMiles} miles.
        </p>
      ) : null}

      {mode === "explore" ? (
        <ul className="flex flex-col gap-3">
          {(restaurantResults ?? []).map((restaurant) => (
            <li key={restaurant.id}>
              <Link
                href={`/restaurant/${restaurant.id}`}
                className="flex flex-col gap-2 rounded-md border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {restaurant.name}
                  </span>
                  <span className="text-sm text-zinc-500">{restaurant.distanceMiles} mi</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {restaurant.cuisine} · Choice Availability Score: {restaurant.score}/100
                </p>

                <div className="flex flex-wrap gap-1">
                  {Object.entries(restaurant.classificationCounts)
                    .filter(([, count]) => count > 0)
                    .map(([classification, count]) => (
                      <span
                        key={classification}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        {count} {CLASSIFICATION_LABELS[classification]}
                      </span>
                    ))}
                </div>

                <ul className="list-inside list-disc text-xs text-zinc-600 dark:text-zinc-400">
                  {restaurant.explanation.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-3">
          {(effectiveDishResults ?? []).map((dish) => (
            <li
              key={dish.id}
              className="flex flex-col gap-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{dish.name}</span>
                <span className="text-sm text-zinc-500">{dish.distanceMiles} mi</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {dish.restaurantName}
                {dish.price ? ` · $${dish.price}` : ""}
              </p>
              {dish.description ? (
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{dish.description}</p>
              ) : null}

              <span className="w-fit rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {CLASSIFICATION_LABELS[dish.classification]}
              </span>

              <ul className="list-inside list-disc text-xs text-zinc-600 dark:text-zinc-400">
                {dish.reasons.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
