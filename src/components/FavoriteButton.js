"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { addGuestFavorite, removeGuestFavorite, isGuestFavorite } from "@/lib/favorites";

// Reusable favorite toggle for restaurant/dish detail pages. `isGuest` is
// passed in by the parent, which already determines guest-vs-signed-in
// once per page load (see RestaurantDetailClient/DishDetailClient's
// profile-load effect) — avoids a second auth check per button.
export default function FavoriteButton({ targetType, targetId, isGuest }) {
  const [favorited, setFavorited] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isGuest === null || isGuest === undefined) return;
    let cancelled = false;

    async function load() {
      if (isGuest) {
        setFavorited(isGuestFavorite({ targetType, targetId }));
        setReady(true);
        return;
      }
      try {
        const response = await fetch(
          `/api/favorites?targetType=${targetType}&targetId=${targetId}`,
        );
        if (!response.ok) throw new Error();
        const body = await response.json();
        if (!cancelled) setFavorited(Boolean(body.favorited));
      } catch {
        // Fail safe to "not favorited" rather than blocking the button.
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isGuest, targetType, targetId]);

  async function toggle() {
    setPending(true);
    setError("");
    const next = !favorited;
    try {
      if (isGuest) {
        if (next) addGuestFavorite({ targetType, targetId });
        else removeGuestFavorite({ targetType, targetId });
      } else {
        const response = await fetch("/api/favorites", {
          method: next ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${response.status}).`);
        }
      }
      setFavorited(next);
    } catch (err) {
      setError(err.message || "Couldn't update favorites.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={!ready || pending}
        className={`flex w-fit min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium disabled:opacity-50 ${
          favorited
            ? "border-accent bg-soft-green text-primary"
            : "border-border bg-card text-text hover:border-accent"
        }`}
      >
        <Heart aria-hidden="true" className="h-4 w-4" fill={favorited ? "currentColor" : "none"} />
        {favorited ? "Saved" : "Save"}
      </button>
      {error ? <p className="text-xs text-status-allergen-text">{error}</p> : null}
    </div>
  );
}
