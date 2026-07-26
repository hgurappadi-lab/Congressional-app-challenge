"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Map as MapIcon, List, X, Navigation, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadGuestProfile, loadUserProfile } from "@/lib/profile";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { getRecommendedDishes } from "@/lib/result-summary";
import RestaurantMap from "@/components/RestaurantMap";
import RestaurantResultCard from "@/components/RestaurantResultCard";
import DishResultCard from "@/components/DishResultCard";
import SafetyReminder from "@/components/SafetyReminder";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import ProfileShortcut from "@/components/ProfileShortcut";

const RADIUS_OPTIONS_MILES = [1, 3, 5, 10, 15];
const SEARCH_DEBOUNCE_MS = 400;
const MAX_DISH_RECOMMENDATIONS = 5;

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

  // Mobile-only Map/List toggle for Explore Nearby, and the restaurant
  // previewed in the bottom sheet when a map marker is tapped.
  const [mobileView, setMobileView] = useState("list"); // "list" | "map"
  const [previewRestaurant, setPreviewRestaurant] = useState(null);

  // Tracks whether we're at the `lg:` breakpoint (where map+list show side
  // by side, ignoring the mobile-only toggle) — used to decide whether
  // RestaurantMap should mount at all. Leaflet initializes against
  // whatever size its container has *right when it mounts*; mounting it
  // behind `hidden` (display:none, zero size) leaves its tiles and markers
  // permanently mispositioned even after the container becomes visible, so
  // it's mounted only once the container will actually be visible.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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
  const recommendedDishResults = effectiveDishResults
    ? getRecommendedDishes(effectiveDishResults, MAX_DISH_RECOMMENDATIONS)
    : [];

  // True once at least one restaurant in range has a dish that's an actual
  // documented match candidate for this profile (strong/modification/
  // confirm) — as opposed to every restaurant being 100% "no data either
  // way" or "confirmed allergen," which isn't a useful ranked list, just a
  // pile of ties. Distinguishing this lets the empty state say plainly
  // that the dataset doesn't have anything for this profile here, instead
  // of showing restaurant cards that all read as equally unhelpful.
  const hasAnyRealMatch = (restaurantResults ?? []).some((restaurant) => {
    const counts = restaurant.classificationCounts;
    return (
      counts.strong_documented_potential_match > 0 ||
      counts.modification_needed > 0 ||
      counts.confirm_before_ordering > 0
    );
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold text-text sm:text-[32px]">
          {mode === "explore" ? "Explore Nearby" : "Find a Dish"}
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-sm font-medium text-primary hover:text-primary-hover">
            Back
          </Link>
          <ProfileShortcut />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("explore")}
          className={`min-h-11 rounded-xl px-4 text-sm font-medium transition-colors ${
            mode === "explore"
              ? "bg-primary text-white"
              : "border border-border bg-card text-text hover:border-accent"
          }`}
        >
          Explore Nearby
        </button>
        <button
          type="button"
          onClick={() => setMode("find-dish")}
          className={`min-h-11 rounded-xl px-4 text-sm font-medium transition-colors ${
            mode === "find-dish"
              ? "bg-primary text-white"
              : "border border-border bg-card text-text hover:border-accent"
          }`}
        >
          Find a Dish
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        {mode === "find-dish" ? (
          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={craving}
                onChange={(event) => setCraving(event.target.value)}
                placeholder="What are you craving?"
                aria-label="Search for a dish"
                className="min-h-11 w-full rounded-2xl border border-border bg-card py-2.5 pl-11 pr-4 text-base text-text placeholder:text-text-muted focus:border-accent"
              />
            </div>
            <p className="text-xs text-text-muted">
              Try &ldquo;spicy fried rice,&rdquo; &ldquo;ramen,&rdquo; or &ldquo;dairy-free pizza.&rdquo;
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={useMyLocation}
            className="flex min-h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-text hover:border-accent"
          >
            <Navigation aria-hidden="true" className="h-4 w-4" />
            Use my location
          </button>

          <label className="flex min-w-0 flex-col gap-1 text-sm text-text-secondary sm:flex-row sm:items-center sm:gap-2">
            or pick a neighborhood
            <select
              value={neighborhoodId}
              onChange={(event) => {
                setNeighborhoodId(event.target.value);
                setLocationSource("neighborhood");
              }}
              className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-card px-2 py-1 text-text sm:w-auto sm:max-w-[220px]"
            >
              {NEIGHBORHOODS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            within
            <select
              value={radiusMiles}
              onChange={(event) => setRadiusMiles(Number(event.target.value))}
              className="min-h-11 rounded-xl border border-border bg-card px-2 py-1 text-text"
            >
              {RADIUS_OPTIONS_MILES.map((mi) => (
                <option key={mi} value={mi}>
                  {mi} mi
                </option>
              ))}
            </select>
          </label>

          {mode === "explore" ? (
            <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 sm:ml-auto lg:hidden" role="group" aria-label="Map or list view">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                aria-pressed={mobileView === "list"}
                className={`flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ${
                  mobileView === "list" ? "bg-card text-primary shadow-sm" : "text-text-secondary"
                }`}
              >
                <List aria-hidden="true" className="h-4 w-4" />
                List
              </button>
              <button
                type="button"
                onClick={() => setMobileView("map")}
                aria-pressed={mobileView === "map"}
                className={`flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ${
                  mobileView === "map" ? "bg-card text-primary shadow-sm" : "text-text-secondary"
                }`}
              >
                <MapIcon aria-hidden="true" className="h-4 w-4" />
                Map
              </button>
            </div>
          ) : null}
        </div>

        {locationError ? <p className="text-sm text-status-confirm-text">{locationError}</p> : null}
      </div>

      {error ? <ErrorState message={error} /> : null}

      {mode === "explore" ? (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className={`${mobileView === "map" ? "block" : "hidden"} lg:block`}>
            <div className="relative">
              {isDesktop || mobileView === "map" ? (
                <RestaurantMap
                  center={activeCoords}
                  restaurants={restaurantResults ?? []}
                  onSelectRestaurant={setPreviewRestaurant}
                />
              ) : (
                <div className="h-64 w-full rounded-2xl bg-surface lg:h-full lg:min-h-[500px]" />
              )}
              {previewRestaurant ? (
                <div className="absolute inset-x-0 bottom-0 lg:hidden">
                  <div className="relative rounded-t-2xl border border-border bg-card p-3 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setPreviewRestaurant(null)}
                      aria-label="Close preview"
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <ul>
                      <RestaurantResultCard restaurant={previewRestaurant} />
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`${mobileView === "list" ? "block" : "hidden"} lg:block`}>
            {loading ? <LoadingSkeleton /> : null}

            {!loading && restaurantResults && restaurantResults.length === 0 ? (
              <EmptyState
                icon={MapIcon}
                title="No restaurants found nearby"
                description={`Try a larger radius than ${radiusMiles} miles.`}
              />
            ) : null}

            {!loading && restaurantResults && restaurantResults.length > 0 && !hasAnyRealMatch ? (
              <EmptyState
                icon={MapIcon}
                title="No options in the dataset match your profile here"
                description={`Nothing within ${radiusMiles} miles has documented information matching your allergies or dietary needs yet. Try a larger radius.`}
              />
            ) : null}

            {!loading && restaurantResults && restaurantResults.length > 0 && hasAnyRealMatch ? (
              <ul className="flex flex-col gap-3">
                {restaurantResults.map((restaurant, index) => (
                  <RestaurantResultCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    highlight={index === 0}
                  />
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : (
        <div>
          {loading ? <LoadingSkeleton /> : null}

          {!loading && craving.trim().length === 0 ? (
            <EmptyState
              icon={Search}
              title="Type a craving above to get started"
              description={`We'll search dishes within ${radiusMiles} miles.`}
            />
          ) : null}

          {!loading && effectiveDishResults && effectiveDishResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title={`No dishes matched "${craving}"`}
              description={`Try a different craving, or a larger radius than ${radiusMiles} miles.`}
            />
          ) : null}

          {!loading && effectiveDishResults && effectiveDishResults.length > 0 ? (
            <div className="flex flex-col gap-4">
              {recommendedDishResults.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No recommended dishes for this search"
                  description="Nothing matching this craving is documented as a good fit for your profile yet. See all results below, or try a different craving."
                />
              ) : (
                <>
                  <SafetyReminder />
                  <ul className="flex flex-col gap-3">
                    {recommendedDishResults.map((dish, index) => (
                      <DishResultCard key={dish.id} dish={dish} highlight={index === 0} />
                    ))}
                  </ul>
                </>
              )}
              <MoreDishResultsSection
                dishes={effectiveDishResults}
                recommendedIds={new Set(recommendedDishResults.map((dish) => dish.id))}
              />
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

// The remaining search matches not already shown in the recommended list —
// mostly dishes with no documented match either way for this profile.
// Collapsed by default so the primary view stays short, but never deleted:
// a craving search that only turns up undocumented dishes should still
// show that they exist, one tap away.
function MoreDishResultsSection({ dishes, recommendedIds }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const rest = dishes.filter((dish) => !recommendedIds.has(dish.id));

  if (rest.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-11 w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-[18px] font-semibold text-text">
          See more results ({rest.length})
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <ul id={contentId} className="flex flex-col gap-3 border-t border-border p-4">
          {rest.map((dish) => (
            <DishResultCard key={dish.id} dish={dish} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
