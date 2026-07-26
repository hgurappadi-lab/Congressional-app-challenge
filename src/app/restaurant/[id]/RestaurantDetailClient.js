"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  MapPin,
  Globe,
  ExternalLink,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Beef,
  Wheat,
  Flame,
  ChefHat,
  CupSoda,
  UtensilsCrossed,
  PlusCircle,
  Fish,
  Leaf,
  Circle,
  Utensils,
} from "lucide-react";
import { lora } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/client";
import { loadGuestProfile, loadUserProfile } from "@/lib/profile";
import { groupDishesByCategory } from "@/lib/group-dishes";
import { getRecommendedDishes } from "@/lib/result-summary";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";
import SafetyReminder from "@/components/SafetyReminder";
import FavoriteButton from "@/components/FavoriteButton";
import ScoreSummary from "@/components/ScoreSummary";
import DishResultCard from "@/components/DishResultCard";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import ProfileShortcut from "@/components/ProfileShortcut";

// Small icon per menu category heading — purely decorative wayfinding, not
// evidence. Falls back to a generic utensils icon for anything unlisted.
const CATEGORY_ICONS = {
  "add-on": PlusCircle,
  appetizer: Leaf,
  starter: Leaf,
  bbq: Flame,
  biryani: ChefHat,
  bowl: Soup,
  bread: Wheat,
  burger: Beef,
  curry: Soup,
  entree: UtensilsCrossed,
  kebab: Flame,
  noodles: Soup,
  pasta: Soup,
  pita: Sandwich,
  pizza: Pizza,
  rice: Soup,
  salad: Salad,
  sandwich: Sandwich,
  shake: CupSoda,
  side: Circle,
  soup: Soup,
  "sushi roll": Fish,
};

function categoryIcon(category) {
  return CATEGORY_ICONS[(category || "").toLowerCase()] ?? Utensils;
}

function googleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function RestaurantDetailClient({ id }) {
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [isGuest, setIsGuest] = useState(true);

  // Load the guest or signed-in profile once on mount.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setIsGuest(!user);

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

  useEffect(() => {
    if (!profile) return;

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      setNotFound(false);
      try {
        const response = await fetch(`/api/restaurant/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            allergies: profile.allergies,
            dietaryRestrictions: profile.dietary_restrictions,
            matchingStrictness: profile.matching_strictness,
          }),
        });
        if (response.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${response.status}).`);
        }
        const body = await response.json();
        if (!cancelled) setData(body);
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
  }, [profile, id]);

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-10">
        <p className="text-sm text-text-secondary">Restaurant not found.</p>
        <Link href="/map" className="text-sm font-medium text-primary hover:text-primary-hover">
          Back to Explore Nearby
        </Link>
      </main>
    );
  }

  const groupedDishes = data ? groupDishesByCategory(data.dishes) : [];
  const recommendedDishes = data ? getRecommendedDishes(data.dishes) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/map"
          className="flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </Link>
        <ProfileShortcut />
      </div>

      {loading ? <LoadingSkeleton count={1} /> : null}
      {error ? <ErrorState message={error} /> : null}

      {data ? (
        <>
          <div className="flex flex-col gap-2">
            <FavoriteButton
              targetType="restaurant"
              targetId={data.restaurant.id}
              isGuest={isGuest}
            />
            <h1 className={`${lora.className} text-3xl text-text sm:text-4xl`}>
              {data.restaurant.name}
            </h1>
            <p className="text-sm text-text-muted">
              {data.restaurant.cuisine}
              {data.restaurant.priceLevel ? ` · ${"$".repeat(data.restaurant.priceLevel)}` : ""}
            </p>

            {data.restaurant.address ? (
              <a
                href={googleMapsUrl(data.restaurant.address)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary"
              >
                <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-text-muted" />
                {data.restaurant.address}
              </a>
            ) : null}

            {data.restaurant.website ? (
              <a
                href={data.restaurant.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
              >
                <Globe aria-hidden="true" className="h-4 w-4 shrink-0" />
                Restaurant website
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : null}
          </div>

          <SafetyDisclaimer />

          <ScoreSummary
            score={data.score}
            menuCoveragePercent={data.menuCoveragePercent}
            crossContactTransparencyPercent={data.crossContactTransparencyPercent}
            freshnessDays={data.freshnessDays}
            evidenceHighlight={data.evidenceHighlight}
            explanation={data.explanation}
          />

          <section className="flex flex-col gap-3">
            <h2 className="text-[22px] font-semibold text-text">Recommended for you</h2>
            {recommendedDishes.length === 0 ? (
              <EmptyState
                icon={Utensils}
                title="No recommended dishes yet"
                description="Nothing on the curated menu is documented as a good match for your profile here. Check the full menu below, or try another restaurant."
              />
            ) : (
              <>
                <SafetyReminder />
                <ul className="flex flex-col gap-3">
                  {recommendedDishes.map((dish, index) => (
                    <DishResultCard key={dish.id} dish={dish} highlight={index === 0} />
                  ))}
                </ul>
              </>
            )}
          </section>

          <FullMenuSection groupedDishes={groupedDishes} />
        </>
      ) : null}
    </main>
  );
}

function FullMenuSection({ groupedDishes }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const totalDishes = groupedDishes.reduce((sum, { dishes }) => sum + dishes.length, 0);

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
          See full menu ({totalDishes} {totalDishes === 1 ? "item" : "items"})
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div id={contentId} className="flex flex-col gap-8 border-t border-border p-4">
          {groupedDishes.map(({ category, dishes }) => {
            const Icon = categoryIcon(category);
            return (
              <div key={category} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <h3 className="text-[18px] font-semibold text-text">{category}</h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {dishes.map((dish) => (
                    <DishResultCard key={dish.id} dish={dish} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
