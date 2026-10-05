"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Map as MapIcon, List, X, Navigation, ChevronDown } from "lucide-react";
import { loadGuestProfile } from "@/lib/profile";
import { getRecommendedDishes } from "@/lib/result-summary";
import RestaurantMap from "@/components/RestaurantMap";
import RestaurantResultCard from "@/components/RestaurantResultCard";
import UnscoredRestaurantCard from "@/components/UnscoredRestaurantCard";
import ExpandableExplanation from "@/components/ExpandableExplanation";
import DishResultCard from "@/components/DishResultCard";
import SafetyReminder from "@/components/SafetyReminder";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import ProfileShortcut from "@/components/ProfileShortcut";

const RADIUS_OPTIONS_MILES = [1, 3, 5, 10, 15];
const TOP_RESULTS_COUNT = 3;
const SEARCH_DEBOUNCE_MS = 400;
const MAX_DISH_RECOMMENDATIONS = 5;

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState(
    searchParams.get("mode") === "find-dish" ? "find-dish" : "explore",
  ); // "explore" | "find-dish"
  const [profile, setProfile] = useState(null);

  const [coords, setCoords] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [radiusMiles, setRadiusMiles] = useState(5);

  const [craving, setCraving] = useState("");
  const [restaurantResults, setRestaurantResults] = useState(null);
  const [dishResults, setDishResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // "More restaurants nearby" — live, unscored candidates from the Google
  // Places API (/api/nearby-live). Loads independently of the curated
  // /api/rank results above so a slow Places response never blocks the
  // trusted, scored results from rendering.
  const [nearbyLiveResults, setNearbyLiveResults] = useState(null);
  const [nearbyLiveLoading, setNearbyLiveLoading] = useState(false);

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

  // Guest-only app — load the on-device profile once on mount. Deferred to
  // an effect (not a lazy useState initializer) so the server-rendered
  // HTML (no localStorage access) matches the client's first paint.
  useEffect(() => {
    function load() {
      setProfile(loadGuestProfile());
    }
    load();
  }, []);

  function useMyLocation() {
    setLocationError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation isn't available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setLocationError("Location permission was denied. Enable location access and try again.");
      },
    );
  }

  // Explore Nearby: fetch ranked restaurants whenever the profile,
  // location, or radius changes.
  useEffect(() => {
    if (!profile || !coords || mode !== "explore") return;

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/rank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: coords.lat,
            lng: coords.lng,
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
  }, [profile, mode, coords, radiusMiles]);

  const hasCravingStarted = mode === "find-dish" && craving.trim().length > 0;

  // In Find a Dish mode, the craving is passed through as `query` (Text
  // Search — see /api/nearby-live), so "pizza" actually returns pizza
  // places instead of the same generic nearby list every time. Debounced
  // like the curated dish search below so it doesn't re-fetch this paid
  // API on every keystroke; Explore Nearby (no craving) still fetches
  // immediately.
  useEffect(() => {
    if (!coords) return;
    if (mode === "find-dish" && !hasCravingStarted) return;

    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setNearbyLiveLoading(true);
        try {
          const response = await fetch("/api/nearby-live", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: coords.lat,
              lng: coords.lng,
              radiusMiles,
              ...(mode === "find-dish" ? { query: craving.trim() } : {}),
            }),
          });
          if (!response.ok) throw new Error();
          const body = await response.json();
          if (!cancelled) setNearbyLiveResults(body.restaurants);
        } catch {
          if (!cancelled) setNearbyLiveResults(null);
        } finally {
          if (!cancelled) setNearbyLiveLoading(false);
        }
      },
      mode === "find-dish" ? SEARCH_DEBOUNCE_MS : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, coords, radiusMiles, craving, hasCravingStarted]);

  // Find a Dish: search a craving, debounced, whenever the profile,
  // craving text, location, or radius changes.
  useEffect(() => {
    if (!profile || !coords || mode !== "find-dish" || craving.trim().length === 0) return;

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
            lat: coords.lat,
            lng: coords.lng,
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
  }, [profile, mode, craving, coords, radiusMiles]);

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
  // Explore Nearby shows only the top TOP_RESULTS_COUNT results ("Choice
  // #1/#2/#3") rather than the full ranked list — /api/rank already sorts
  // by score descending, so this is just a slice of an already-sorted list.
  const topRestaurantResults = (restaurantResults ?? []).slice(0, TOP_RESULTS_COUNT);

  // Only hides the top-3 list when a restaurant's menu is entirely
  // ALLERGEN_IDENTIFIED (a real, known conflict on every dish) or has no
  // evaluated menu items at all — insufficient-information dishes still
  // count as "worth showing," matching getRecommendedDishes' policy above:
  // restaurants can often accommodate a request even without documentation
  // either way, and every card/dish still carries its own honest
  // "Limited choice availability" tier / "confirm before ordering" label,
  // never a false "safe" claim.
  const hasAnyRealMatch = topRestaurantResults.some((restaurant) => {
    const counts = restaurant.classificationCounts;
    return (
      counts.strong_documented_potential_match > 0 ||
      counts.modification_needed > 0 ||
      counts.confirm_before_ordering > 0 ||
      counts.insufficient_information > 0
    );
  });

  // Shared between Explore Nearby and Find a Dish — a list of live,
  // unscored Google Places restaurants outside the curated dataset. The
  // list itself is always chosen deterministically (nearest by distance);
  // `craving`, when given, is only ever passed to each card's own
  // human-triggered "check with AI" button, never used to have AI
  // pick/filter which restaurants appear here.
  function renderNearbyLiveSection(craving) {
    if (!nearbyLiveLoading && !(nearbyLiveResults && nearbyLiveResults.length > 0)) return null;
    return (
      <div className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">
          More restaurants nearby — not yet verified in our dataset
        </h2>

        {nearbyLiveLoading ? (
          <LoadingSkeleton />
        ) : (
          <ExpandableExplanation label={`Check out other options (${nearbyLiveResults.length})`}>
            <ul className="flex flex-col gap-3">
              {nearbyLiveResults.map((restaurant) => (
                <UnscoredRestaurantCard
                  key={`${restaurant.name}-${restaurant.lat}-${restaurant.lng}`}
                  restaurant={restaurant}
                  craving={craving}
                />
              ))}
            </ul>
          </ExpandableExplanation>
        )}
      </div>
    );
  }

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

      {!coords ? (
        <EmptyState
          icon={Navigation}
          title="Share your location to get started"
          description="We'll look for restaurants within your selected radius, wherever you are."
          action={
            <button
              type="button"
              onClick={useMyLocation}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Navigation aria-hidden="true" className="h-4 w-4" />
              Use my location
            </button>
          }
        />
      ) : (
        <>
          {mode === "explore" ? (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className={`${mobileView === "map" ? "block" : "hidden"} lg:block`}>
            <div className="relative">
              {isDesktop || mobileView === "map" ? (
                <RestaurantMap
                  center={coords}
                  restaurants={topRestaurantResults}
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
                title="No curated matches this close yet"
                description="Our verified dataset doesn't cover this area yet — see live results from Google below, or try a larger radius."
              />
            ) : null}

            {!loading && restaurantResults && restaurantResults.length > 0 && !hasAnyRealMatch ? (
              <EmptyState
                icon={MapIcon}
                title="No curated options match your profile here"
                description={`Nothing within ${radiusMiles} miles has documented information matching your allergies or dietary needs yet — see live results from Google below, or try a larger radius.`}
              />
            ) : null}

            {!loading && restaurantResults && restaurantResults.length > 0 && hasAnyRealMatch ? (
              <ul className="flex flex-col gap-3">
                {topRestaurantResults.map((restaurant, index) => (
                  <RestaurantResultCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    rank={index + 1}
                  />
                ))}
              </ul>
            ) : null}

            {renderNearbyLiveSection()}
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
              title={`No curated dishes matched "${craving}"`}
              description="See live results from Google below, or try a different craving or a larger radius."
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

          {hasCravingStarted ? renderNearbyLiveSection(craving.trim()) : null}
        </div>
          )}
        </>
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
