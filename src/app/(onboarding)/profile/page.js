"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Salad, Leaf, ShieldCheck, Save, Trash2 } from "lucide-react";
import { lora } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/client";
import {
  emptyProfile,
  loadGuestProfile,
  saveGuestProfile,
  loadUserProfile,
  saveUserProfile,
} from "@/lib/profile";
import { ALLERGENS, DEFAULT_ALLERGY_SEVERITY, DIETARY_RESTRICTIONS } from "@/lib/profile-options";
import AllergenChip from "@/components/AllergenChip";
import DietaryChip from "@/components/DietaryChip";
import ProfileSummary from "@/components/ProfileSummary";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";

const OFFERED_DIETARY_IDS = new Set(DIETARY_RESTRICTIONS.map((d) => d.id));

// Matching strictness is no longer user-configurable (always "standard"),
// and dietary restrictions are now only offered as a subset of what the
// schema supports — normalize both on load so an older saved profile
// (from before either change) doesn't carry a restriction/setting there's
// no longer a control for.
function normalizeProfile(profile) {
  return {
    ...profile,
    matching_strictness: "standard",
    dietary_restrictions: profile.dietary_restrictions.filter((id) => OFFERED_DIETARY_IDS.has(id)),
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (user) {
        setUserId(user.id);
        try {
          const loaded = await loadUserProfile(supabase, user.id);
          if (!cancelled) setProfile(normalizeProfile(loaded));
        } catch (error) {
          if (!cancelled) setErrorMessage(error.message);
        }
      } else {
        setProfile(normalizeProfile(loadGuestProfile()));
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleAllergen(allergenId) {
    setProfile((prev) => {
      const exists = prev.allergies.some((a) => a.allergen === allergenId);
      const allergies = exists
        ? prev.allergies.filter((a) => a.allergen !== allergenId)
        : [...prev.allergies, { allergen: allergenId, severity: DEFAULT_ALLERGY_SEVERITY }];
      return { ...prev, allergies };
    });
  }

  function toggleDietaryRestriction(restrictionId) {
    setProfile((prev) => {
      const exists = prev.dietary_restrictions.includes(restrictionId);
      const dietary_restrictions = exists
        ? prev.dietary_restrictions.filter((r) => r !== restrictionId)
        : [...prev.dietary_restrictions, restrictionId];
      return { ...prev, dietary_restrictions };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (profile.allergies.length === 0 && profile.dietary_restrictions.length === 0) {
      setErrorMessage("Select at least one allergy or dietary restriction to continue.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      if (userId) {
        const supabase = createClient();
        await saveUserProfile(supabase, userId, profile);
      } else {
        saveGuestProfile(profile);
      }
      router.push("/home");
    } catch (error) {
      setErrorMessage(error.message);
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account? This permanently removes your profile and favorites and can't be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${response.status}).`);
      }
      router.push("/home");
    } catch (error) {
      setErrorMessage(error.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-text-muted">Loading…</p>
      </main>
    );
  }

  const hasSelection = profile.allergies.length > 0 || profile.dietary_restrictions.length > 0;

  return (
    <main className="relative flex-1 overflow-hidden bg-gradient-to-br from-pale-green via-page to-page px-4 py-8 sm:px-6 sm:py-10">
      <Leaf aria-hidden="true" className="pointer-events-none absolute -left-4 top-1/3 h-24 w-24 -rotate-12 text-accent opacity-10" />
      <Leaf aria-hidden="true" className="pointer-events-none absolute -right-6 bottom-24 h-32 w-32 rotate-45 text-accent opacity-10" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-semibold text-white">
            C
          </span>
          <span className="text-lg font-semibold text-text">ClearPlate</span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10 sm:pb-28">
          <div className="pointer-events-none absolute right-8 top-8 hidden sm:block">
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-soft-green text-primary">
              <Salad aria-hidden="true" className="h-11 w-11" />
              <Leaf aria-hidden="true" className="absolute -left-3 -top-2 h-4 w-4 text-accent opacity-70" />
              <Leaf aria-hidden="true" className="absolute -right-2 top-12 h-3 w-3 text-accent opacity-50" />
            </span>
          </div>

          <div className="flex flex-col gap-1 pr-0 sm:pr-28">
            <h1 className={`${lora.className} text-3xl text-text sm:text-4xl`}>Your food profile</h1>
            <p className="text-sm font-medium text-primary">
              {userId
                ? "Saved to your account."
                : "Saved on this device only — sign up to keep it across devices."}
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-status-match-border bg-status-match-bg px-4 py-3 sm:mr-28">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-status-match-text" />
            <ProfileSummary
              allergies={profile.allergies}
              dietaryRestrictions={profile.dietary_restrictions}
              className="text-sm font-medium text-status-match-text"
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
            <fieldset className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
                  <Leaf aria-hidden="true" className="h-4 w-4" />
                </span>
                <legend className={`${lora.className} text-xl text-text`}>Allergies</legend>
              </div>
              <p className="pl-[42px] text-sm text-text-secondary">
                Select the ingredients you want to avoid.
              </p>
              <div className="flex flex-wrap gap-2 pl-[42px]">
                {ALLERGENS.map((allergen) => {
                  const selected = profile.allergies.some((a) => a.allergen === allergen.id);
                  return (
                    <AllergenChip
                      key={allergen.id}
                      label={allergen.label}
                      icon={allergen.icon}
                      selected={selected}
                      onToggle={() => toggleAllergen(allergen.id)}
                    />
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft-green text-primary">
                  <Leaf aria-hidden="true" className="h-4 w-4" />
                </span>
                <legend className={`${lora.className} text-xl text-text`}>Dietary restrictions</legend>
              </div>
              <p className="pl-[42px] text-sm text-text-secondary">
                Select dietary preferences that matter to you.
              </p>
              <div className="flex flex-wrap gap-2 pl-[42px]">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <DietaryChip
                    key={restriction.id}
                    label={restriction.label}
                    icon={restriction.icon}
                    selected={profile.dietary_restrictions.includes(restriction.id)}
                    onToggle={() => toggleDietaryRestriction(restriction.id)}
                  />
                ))}
              </div>
            </fieldset>

            <SafetyDisclaimer />

            {errorMessage ? <p className="text-sm text-status-allergen-text">{errorMessage}</p> : null}

            <button
              type="submit"
              disabled={saving || !hasSelection}
              className="hidden min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 sm:flex"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {saving ? "Saving…" : "Save profile"}
            </button>

            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card p-4 sm:hidden">
              <button
                type="submit"
                disabled={saving || !hasSelection}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-white disabled:opacity-50"
              >
                <Save aria-hidden="true" className="h-4 w-4" />
                {saving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </form>

          {userId ? (
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="mx-auto mt-6 flex min-h-11 items-center gap-1.5 text-sm font-medium text-status-allergen-text disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {deleting ? "Deleting account…" : "Delete my account"}
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
