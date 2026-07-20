"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  emptyProfile,
  loadGuestProfile,
  saveGuestProfile,
  loadUserProfile,
  saveUserProfile,
} from "@/lib/profile";
import {
  ALLERGENS,
  SEVERITY_LEVELS,
  DIETARY_RESTRICTIONS,
  MATCHING_STRICTNESS_OPTIONS,
} from "@/lib/profile-options";

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          if (!cancelled) setProfile(loaded);
        } catch (error) {
          if (!cancelled) setErrorMessage(error.message);
        }
      } else {
        setProfile(loadGuestProfile());
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
        : [...prev.allergies, { allergen: allergenId, severity: "moderate" }];
      return { ...prev, allergies };
    });
  }

  function setAllergenSeverity(allergenId, severity) {
    setProfile((prev) => ({
      ...prev,
      allergies: prev.allergies.map((a) =>
        a.allergen === allergenId ? { ...a, severity } : a,
      ),
    }));
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

  function setMatchingStrictness(value) {
    setProfile((prev) => ({ ...prev, matching_strictness: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
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

  if (loading) {
    return (
      <main className="mx-auto flex max-w-lg flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Your food profile
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {userId
            ? "Saved to your account."
            : "Saved on this device only — sign up to keep it across devices."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Allergies
          </legend>
          <div className="flex flex-col gap-2">
            {ALLERGENS.map((allergen) => {
              const selected = profile.allergies.find(
                (a) => a.allergen === allergen.id,
              );
              return (
                <div
                  key={allergen.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <label className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-50">
                    <input
                      type="checkbox"
                      checked={Boolean(selected)}
                      onChange={() => toggleAllergen(allergen.id)}
                    />
                    {allergen.label}
                  </label>

                  {selected ? (
                    <select
                      value={selected.severity}
                      onChange={(event) =>
                        setAllergenSeverity(allergen.id, event.target.value)
                      }
                      className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
                    >
                      {SEVERITY_LEVELS.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Dietary restrictions
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <label
                key={restriction.id}
                className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
              >
                <input
                  type="checkbox"
                  checked={profile.dietary_restrictions.includes(
                    restriction.id,
                  )}
                  onChange={() => toggleDietaryRestriction(restriction.id)}
                />
                {restriction.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Matching strictness
          </legend>
          <div className="flex flex-col gap-2">
            {MATCHING_STRICTNESS_OPTIONS.map((option) => (
              <label
                key={option.id}
                className="flex flex-col gap-1 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  <input
                    type="radio"
                    name="matching_strictness"
                    checked={profile.matching_strictness === option.id}
                    onChange={() => setMatchingStrictness(option.id)}
                  />
                  {option.label}
                </span>
                <span className="pl-6 text-xs text-zinc-600 dark:text-zinc-400">
                  {option.description}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="rounded-md bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Restaurant ingredients, recipes, preparation procedures, and
          equipment may change. Results are based on available public
          information and do not guarantee that a dish is free from
          allergens or cross-contact. Always confirm ingredients and
          preparation procedures directly with the restaurant before
          ordering.
        </p>

        {errorMessage ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </main>
  );
}
