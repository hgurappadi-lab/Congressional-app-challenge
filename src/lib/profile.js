// Guest-mode profile storage.
//
// Registered users' profiles live in Supabase (the `profiles` table, RLS'd
// to their own row). Guest users get the exact same profile shape, but it
// lives only in the browser's localStorage — nothing is sent to the server
// until/unless they create an account. This is what lets a judge use the
// full app with zero signup (CAC §16 requires judge access without an
// account).

const GUEST_PROFILE_KEY = "allergy-food-app:guest-profile";

export const MATCHING_STRICTNESS_VALUES = [
  "standard",
  "cautious",
  "cross_contact_sensitive",
];

export function emptyProfile() {
  return {
    allergies: [], // [{ allergen: "peanuts", severity: "severe" }, ...]
    dietary_restrictions: [],
    matching_strictness: "standard",
  };
}

// Whether a guest has ever saved a profile on this device — distinct from
// the profile's *contents*, since an empty allergies/restrictions list is a
// valid saved profile (someone with no allergies). Used to decide whether
// the welcome popup still needs to be shown.
export function hasGuestProfile() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUEST_PROFILE_KEY) !== null;
}

export function loadGuestProfile() {
  if (typeof window === "undefined") return emptyProfile();

  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw);
    return { ...emptyProfile(), ...parsed };
  } catch {
    // Corrupted or unreadable localStorage entry — fail safe to an empty
    // profile rather than crashing the app.
    return emptyProfile();
  }
}

export function saveGuestProfile(profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
}

export function clearGuestProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GUEST_PROFILE_KEY);
}

// Saves a profile for a signed-in user via the browser Supabase client.
// Callers pass in the client (from lib/supabase/client.js) so this module
// stays free of a hard dependency on how the client is constructed.
export async function saveUserProfile(supabase, userId, profile) {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    allergies: profile.allergies,
    dietary_restrictions: profile.dietary_restrictions,
    matching_strictness: profile.matching_strictness,
  });

  if (error) throw error;
}

export async function loadUserProfile(supabase, userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("allergies, dietary_restrictions, matching_strictness")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ? { ...emptyProfile(), ...data } : emptyProfile();
}
