"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Leaf, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadGuestProfile, loadUserProfile } from "@/lib/profile";
import { ALLERGENS, DIETARY_RESTRICTIONS } from "@/lib/profile-options";
import { formatList } from "@/lib/result-summary";

const ALLERGEN_LABELS = Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label]));
const DIETARY_LABELS = Object.fromEntries(DIETARY_RESTRICTIONS.map((d) => [d.id, d.label]));

// Compact "Your profile" pill linking to /profile — shown near the top of
// every main app page so the user's allergy list is always one tap away.
// Self-contained (loads its own guest/signed-in profile) so it can be
// dropped into any page without threading profile state through props.
export default function ProfileShortcut() {
  const [profile, setProfile] = useState(null);

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

  const allergenNames = (profile?.allergies ?? []).map((a) => ALLERGEN_LABELS[a.allergen] ?? a.allergen);
  const dietaryNames = (profile?.dietary_restrictions ?? []).map((id) => DIETARY_LABELS[id] ?? id);
  const summaryNames = [...allergenNames, ...dietaryNames];

  return (
    <Link
      href="/profile"
      className="flex min-h-11 items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pl-2 pr-3 shadow-sm hover:border-accent"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
        <Leaf aria-hidden="true" className="h-4 w-4" />
      </span>
      <span className="flex flex-col text-left leading-tight">
        <span className="text-xs text-text-muted">Your profile</span>
        <span className="text-sm font-medium text-text">
          {summaryNames.length > 0 ? formatList(summaryNames) : "Set your preferences"}
        </span>
      </span>
      <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-text-muted" />
    </Link>
  );
}
