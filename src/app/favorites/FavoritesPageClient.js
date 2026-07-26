"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Utensils } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  loadGuestFavorites,
  removeGuestFavorite,
  guestFavoriteKey,
} from "@/lib/favorites";
import EmptyState from "@/components/EmptyState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import ProfileShortcut from "@/components/ProfileShortcut";

// Resolves a guest favorite entry's display name via the existing public
// restaurant/dish detail routes (body {}, relying on their existing
// default profile params) rather than a new bulk-lookup endpoint — an
// accepted N+1 tradeoff since N is one guest's favorites list, small by
// construction.
async function resolveGuestFavorite(entry) {
  const path =
    entry.targetType === "restaurant"
      ? `/api/restaurant/${entry.targetId}`
      : `/api/dish/${entry.targetId}`;
  const fallback = {
    ...entry,
    key: guestFavoriteKey(entry),
    available: false,
    name: null,
    restaurantId: null,
    restaurantName: null,
  };
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (response.status === 404) return fallback;
    if (!response.ok) return fallback;
    const body = await response.json();
    if (entry.targetType === "restaurant") {
      return { ...entry, key: guestFavoriteKey(entry), available: true, name: body.restaurant.name };
    }
    return {
      ...entry,
      key: guestFavoriteKey(entry),
      available: true,
      name: body.dish.name,
      restaurantId: body.restaurant?.id ?? null,
      restaurantName: body.restaurant?.name ?? null,
    };
  } catch {
    return fallback;
  }
}

// Favorites deliberately don't reuse RestaurantResultCard/DishResultCard —
// neither the guest lookup nor the signed-in /api/favorites list carries
// classification/score data for this user's real profile (both intentionally
// use a stub profile), so showing a status badge or score here would be
// misleading rather than simplified. This is a plain, consistently-styled
// name + link + remove card instead.
function FavoriteRow({ item, onRemove }) {
  const Icon = item.targetType === "restaurant" ? MapPin : Utensils;

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-soft-green text-primary">
          <Icon aria-hidden="true" className="h-4.5 w-4.5" />
        </span>
        <div className="flex flex-col gap-0.5">
          {item.available ? (
            <>
              <Link
                href={item.targetType === "restaurant" ? `/restaurant/${item.targetId}` : `/dish/${item.targetId}`}
                className="font-medium text-text hover:text-primary"
              >
                {item.name}
              </Link>
              {item.targetType === "dish" && item.restaurantName ? (
                <Link href={`/restaurant/${item.restaurantId}`} className="text-sm text-text-secondary hover:text-primary">
                  {item.restaurantName}
                </Link>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-text-muted">No longer available in the curated dataset.</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item)}
        className="min-h-11 shrink-0 rounded-xl border border-border px-3 text-sm font-medium text-text-secondary hover:border-accent"
      >
        Remove
      </button>
    </li>
  );
}

export default function FavoritesPageClient() {
  const [isGuest, setIsGuest] = useState(null);
  const [favorites, setFavorites] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setIsGuest(!user);

      try {
        if (!user) {
          const entries = loadGuestFavorites();
          const resolved = await Promise.all(entries.map(resolveGuestFavorite));
          if (!cancelled) setFavorites(resolved);
        } else {
          const response = await fetch("/api/favorites");
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `Request failed (${response.status}).`);
          }
          const body = await response.json();
          if (!cancelled) setFavorites(body.favorites);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleRemove(item) {
    if (isGuest) {
      removeGuestFavorite({ targetType: item.targetType, targetId: item.targetId });
      setFavorites((prev) => prev.filter((f) => f.key !== item.key));
      return;
    }
    fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: item.targetType, targetId: item.targetId }),
    }).then(() => {
      setFavorites((prev) => prev.filter((f) => f.id !== item.id));
    });
  }

  const restaurantFavorites = (favorites ?? []).filter((f) => f.targetType === "restaurant");
  const dishFavorites = (favorites ?? []).filter((f) => f.targetType === "dish");
  const isEmpty = favorites !== null && restaurantFavorites.length === 0 && dishFavorites.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold text-text sm:text-[32px]">Favorites</h1>
        <div className="flex items-center gap-4">
          <Link href="/home" className="text-sm font-medium text-primary hover:text-primary-hover">
            Back
          </Link>
          <ProfileShortcut />
        </div>
      </div>

      {loading ? <LoadingSkeleton /> : null}
      {error ? <ErrorState message={error} /> : null}

      {isEmpty ? (
        <EmptyState
          icon={Heart}
          title="No favorites saved yet"
          description="Save restaurants and dishes as you explore to find them again here."
          action={
            <Link href="/map" className="text-sm font-medium text-primary hover:text-primary-hover">
              Explore Nearby
            </Link>
          }
        />
      ) : null}

      {restaurantFavorites.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold text-text">Restaurants</h2>
          <ul className="flex flex-col gap-3">
            {restaurantFavorites.map((item) => (
              <FavoriteRow key={item.key ?? item.id} item={item} onRemove={handleRemove} />
            ))}
          </ul>
        </section>
      ) : null}

      {dishFavorites.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-[22px] font-semibold text-text">Dishes</h2>
          <ul className="flex flex-col gap-3">
            {dishFavorites.map((item) => (
              <FavoriteRow key={item.key ?? item.id} item={item} onRemove={handleRemove} />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
