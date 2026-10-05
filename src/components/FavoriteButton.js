"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { addGuestFavorite, removeGuestFavorite, isGuestFavorite } from "@/lib/favorites";

// Reusable favorite toggle for restaurant/dish detail pages. Guest-only
// app — no accounts — so this always reads/writes localStorage.
export default function FavoriteButton({ targetType, targetId }) {
  const [favorited, setFavorited] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Deferred to an effect (not a lazy useState initializer) so the
    // server-rendered HTML (no localStorage access) matches the client's
    // first paint before this reflects the real favorited state.
    function load() {
      setFavorited(isGuestFavorite({ targetType, targetId }));
    }
    load();
  }, [targetType, targetId]);

  function toggle() {
    setError("");
    const next = !favorited;
    try {
      if (next) addGuestFavorite({ targetType, targetId });
      else removeGuestFavorite({ targetType, targetId });
      setFavorited(next);
    } catch {
      setError("Couldn't update favorites.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        className={`flex w-fit min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${
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
