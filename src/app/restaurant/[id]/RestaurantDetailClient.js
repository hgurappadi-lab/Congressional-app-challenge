"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadGuestProfile, loadUserProfile } from "@/lib/profile";
import { CLASSIFICATION_LABELS } from "@/lib/classification-labels";
import { groupDishesByCategory } from "@/lib/group-dishes";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";

function freshnessText(freshnessDays) {
  if (freshnessDays === null) return "Verification date unknown.";
  if (freshnessDays <= 30) return "Data was verified within the last month.";
  if (freshnessDays <= 180) return "Data was verified within the last 6 months.";
  return `Data was last verified ${freshnessDays} days ago and may be stale.`;
}

export default function RestaurantDetailClient({ id }) {
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Restaurant not found.</p>
        <Link href="/map" className="text-sm underline">
          Back to Explore Nearby
        </Link>
      </main>
    );
  }

  const groupedDishes = data ? groupDishesByCategory(data.dishes) : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/map" className="text-sm underline">
        Back
      </Link>

      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {data ? (
        <>
          <div className="flex flex-col gap-1">
            {/* A "Save to favorites" button belongs here once /api/favorites
                (build plan step 9) exists — not built yet. */}
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {data.restaurant.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {data.restaurant.cuisine}
              {data.restaurant.priceLevel ? ` · ${"$".repeat(data.restaurant.priceLevel)}` : ""}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{data.restaurant.address}</p>
            {data.restaurant.website ? (
              <a
                href={data.restaurant.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                Restaurant website
              </a>
            ) : null}
          </div>

          <SafetyDisclaimer />

          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Choice Availability Score: {data.score}/100
            </p>
            <ul className="list-inside list-disc text-xs text-zinc-600 dark:text-zinc-400">
              {data.explanation.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              {data.menuCoveragePercent}% of the curated menu has documented allergen information
              · Cross-contact transparency: {data.crossContactTransparencyPercent}% ·{" "}
              {freshnessText(data.freshnessDays)}
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {groupedDishes.map(({ category, dishes }) => (
              <div key={category} className="flex flex-col gap-3">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{category}</h2>
                <ul className="flex flex-col gap-3">
                  {dishes.map((dish) => (
                    <li
                      key={dish.id}
                      className="flex flex-col gap-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {dish.name}
                        </span>
                        {dish.price ? (
                          <span className="text-sm text-zinc-500">${dish.price}</span>
                        ) : null}
                      </div>
                      {dish.description ? (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {dish.description}
                        </p>
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
              </div>
            ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
