"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loadGuestProfile, loadUserProfile } from "@/lib/profile";
import { ALLERGENS, DIETARY_RESTRICTIONS } from "@/lib/profile-options";
import {
  ASSESSMENT_LABELS,
  DIETARY_STATUS_LABELS,
  EVIDENCE_SOURCE_LABELS,
} from "@/lib/evidence-labels";
import StatusBadge from "@/components/StatusBadge";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";
import FavoriteButton from "@/components/FavoriteButton";
import AllergenAssessmentRow from "@/components/AllergenAssessmentRow";
import CrossContactNotice from "@/components/CrossContactNotice";
import QuestionChecklist from "@/components/QuestionChecklist";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import ProfileShortcut from "@/components/ProfileShortcut";

const ALLERGEN_LABELS = Object.fromEntries(ALLERGENS.map((a) => [a.id, a.label]));
const DIETARY_LABELS = Object.fromEntries(DIETARY_RESTRICTIONS.map((d) => [d.id, d.label]));

function idLabel(map, id) {
  return map[id] ?? id.replace(/_/g, " ");
}

// Section-level collapsible (distinct from ExpandableExplanation's inline
// "Why this result?" links) — used for the page's bigger content blocks.
// Closed by default; only opened up-front when `defaultOpen` flags an
// actual warning, per the redesign's "only important warning sections
// should open automatically" rule.
function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-11 w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-[18px] font-semibold text-text">{title}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div id={contentId} className="flex flex-col gap-3 border-t border-border p-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export default function DishDetailClient({ id }) {
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
        const response = await fetch(`/api/dish/${id}`, {
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
        <p className="text-sm text-text-secondary">Dish not found.</p>
        <Link href="/map" className="text-sm font-medium text-primary hover:text-primary-hover">
          Back to Explore Nearby
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
        <Link href="/map" className="text-sm font-medium text-primary hover:text-primary-hover">
          Back
        </Link>
        {loading ? <LoadingSkeleton count={1} /> : null}
        {error ? <ErrorState message={error} /> : null}
      </main>
    );
  }

  // Merge allergens + dietary restrictions into one "your checks" / "other"
  // pair (both are just "things from my profile, checked against this
  // dish"), and drop anything with literally no evidence either way —
  // showing a wall of "no assessment available" rows isn't useful, and the
  // page's top-level status badge already honestly reflects when there's
  // not enough information overall.
  const allergenItems = data.allergenAssessments
    .filter((row) => row.assessment !== "unknown")
    .map((row) => ({
      key: `allergen-${row.allergen}`,
      isSelected: row.isSelected,
      label: idLabel(ALLERGEN_LABELS, row.allergen),
      brief: ASSESSMENT_LABELS[row.assessment],
      evidenceSourceLabel: EVIDENCE_SOURCE_LABELS[row.evidenceSource],
      confidence: row.confidence,
      evidenceNote: row.evidenceNote,
      lastVerifiedAt: row.lastVerifiedAt,
    }));
  const dietaryItems = data.dietaryAssessments
    .filter((row) => row.status !== "unknown")
    .map((row) => ({
      key: `dietary-${row.attribute}`,
      isSelected: row.isSelected,
      label: idLabel(DIETARY_LABELS, row.attribute),
      brief: DIETARY_STATUS_LABELS[row.status],
      evidenceSourceLabel: EVIDENCE_SOURCE_LABELS[row.evidenceSource],
      confidence: row.confidence,
      lastVerifiedAt: row.lastVerifiedAt,
    }));
  const allItems = [...allergenItems, ...dietaryItems];
  const selectedItems = allItems.filter((item) => item.isSelected);
  const otherItems = allItems.filter((item) => !item.isSelected);

  const crossContactHasWarning =
    profile?.matching_strictness === "cross_contact_sensitive" && data.crossContactNotes.length === 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {data.restaurant ? (
          <Link
            href={`/restaurant/${data.restaurant.id}`}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Back to {data.restaurant.name}
          </Link>
        ) : (
          <Link href="/map" className="text-sm font-medium text-primary hover:text-primary-hover">
            Back
          </Link>
        )}
        <ProfileShortcut />
      </div>

      <div className="flex flex-col gap-2">
        <FavoriteButton targetType="dish" targetId={data.dish.id} isGuest={isGuest} />
        <h1 className="text-[26px] font-semibold text-text sm:text-[32px]">{data.dish.name}</h1>
        {data.restaurant ? (
          <Link
            href={`/restaurant/${data.restaurant.id}`}
            className="text-sm font-medium text-text-secondary hover:text-primary"
          >
            {data.restaurant.name}
          </Link>
        ) : null}
        {data.dish.price ? <p className="text-sm text-text-muted">${data.dish.price}</p> : null}
        {data.dish.description ? (
          <p className="text-sm text-text-secondary">{data.dish.description}</p>
        ) : null}

        <div className="mt-1 flex flex-col gap-2">
          <StatusBadge classification={data.classification} />
          {data.reasons?.[0] ? <p className="text-sm text-text-secondary">{data.reasons[0]}</p> : null}
        </div>

        {data.dish.lastCheckedAt ? (
          <p className="text-xs text-text-muted">Last checked: {data.dish.lastCheckedAt}</p>
        ) : null}
      </div>

      <SafetyDisclaimer />

      <section className="flex flex-col gap-3">
        <h2 className="text-[22px] font-semibold text-text">Your allergy checks</h2>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No documented information yet for your selected allergies or dietary needs.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedItems.map((item) => (
              <AllergenAssessmentRow
                key={item.key}
                label={item.label}
                brief={item.brief}
                evidenceSourceLabel={item.evidenceSourceLabel}
                confidence={item.confidence}
                evidenceNote={item.evidenceNote}
                lastVerifiedAt={item.lastVerifiedAt}
              />
            ))}
          </div>
        )}
      </section>

      {otherItems.length > 0 ? (
        <CollapsibleSection title="Other allergen information">
          <div className="flex flex-col gap-2">
            {otherItems.map((item) => (
              <AllergenAssessmentRow
                key={item.key}
                label={item.label}
                brief={item.brief}
                evidenceSourceLabel={item.evidenceSourceLabel}
                confidence={item.confidence}
                evidenceNote={item.evidenceNote}
                lastVerifiedAt={item.lastVerifiedAt}
              />
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {data.modifications.length > 0 ? (
        <CollapsibleSection title="Available modifications">
          <ul className="flex flex-col gap-3">
            {data.modifications.map((mod, i) => (
              <li key={i} className="flex flex-col gap-1 rounded-2xl border border-border p-3">
                <p className="text-sm text-text">{mod.description}</p>
                <p className="text-xs text-text-muted">
                  {EVIDENCE_SOURCE_LABELS[mod.evidenceSource]} · {mod.confidence} confidence
                </p>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      ) : null}

      {data.crossContactNotes.length > 0 ? (
        <CollapsibleSection title="Cross-contact" defaultOpen={crossContactHasWarning}>
          <CrossContactNotice
            notes={data.crossContactNotes.map((note) => ({
              ...note,
              evidenceSourceLabel: EVIDENCE_SOURCE_LABELS[note.evidenceSource],
            }))}
          />
        </CollapsibleSection>
      ) : null}

      {data.questions.length > 0 ? (
        <CollapsibleSection title="Questions to ask">
          <QuestionChecklist questions={data.questions} />
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection title="Sources and dates">
        <ul className="flex flex-col gap-1 text-sm text-text-secondary">
          {data.dish.sourceType ? <li>Source type: {data.dish.sourceType}</li> : null}
          {data.dish.sourceUrl ? (
            <li>
              <a
                href={data.dish.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary hover:text-primary-hover"
              >
                View source
              </a>
            </li>
          ) : null}
          {data.dish.dataCollectedAt ? <li>Data collected: {data.dish.dataCollectedAt}</li> : null}
          {data.dish.lastCheckedAt ? <li>Last checked: {data.dish.lastCheckedAt}</li> : null}
        </ul>
      </CollapsibleSection>
    </main>
  );
}
