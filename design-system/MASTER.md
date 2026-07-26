# Design System — MASTER

Source of truth for the allergy-aware food discovery app's visual and
information-hierarchy rules. Approved 2026-07-21. Any page-specific
deviation should live in `design-system/pages/<page>.md` and override this
file for that page only.

## Product tone

Friendly, calm, healthy, trustworthy, modern, approachable, evidence-driven,
easy to understand. Not clinical, not childish, not alarmist, not a
developer dashboard. Light theme only — no dark mode.

## Color tokens

Implemented as CSS variables in `src/app/globals.css`, exposed to Tailwind
via `@theme inline`. Use the token utility classes (`bg-page`, `text-text`,
`border-border`, etc.) — never raw hex values in component code.

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#166534` | Primary buttons, links, brand |
| `--color-primary-hover` | `#14532D` | Primary hover state |
| `--color-accent` | `#22C55E` | Accents, active states |
| `--color-soft-green` | `#DCFCE7` | Selected chip background |
| `--color-pale-green` | `#F0FDF4` | Subtle section backgrounds |
| `--color-page` | `#F8FAF9` | Page background |
| `--color-card` | `#FFFFFF` | Card background |
| `--color-text` | `#17211B` | Primary text |
| `--color-text-secondary` | `#5F6F64` | Secondary text |
| `--color-text-muted` | `#7C8A80` | Muted/supporting text |
| `--color-border` | `#DCE5DE` | Card/control borders |
| `--color-surface` | `#F3F7F4` | Light surface fill |

## Status colors (5-way, maps 1:1 to `CLASSIFICATIONS` in `src/lib/classification.js`)

| Classification | Label | Text | Background | Border |
|---|---|---|---|---|
| `strong_documented_potential_match` | Strong documented potential match | `#166534` | `#DCFCE7` | `#86EFAC` |
| `modification_needed` | May match with a modification | `#9A5A00` | `#FFF7D6` | `#F5C451` |
| `confirm_before_ordering` | Confirm before ordering | `#A15C00` | `#FFF4E5` | `#F2B35D` |
| `allergen_identified` | Allergen identified | `#B42318` | `#FEECEC` | `#FCA5A5` |
| `insufficient_information` | Insufficient information | `#5F6B63` | `#F1F4F2` | `#D6DDD8` |

**Safety rules:** never use "safe"/"guaranteed" to describe a dish or
restaurant. Green = "strong documented potential match," never guaranteed
safety. Red is reserved for confirmed allergens/serious errors. Amber =
confirmation/modification required. Gray = unknown. Every status badge
carries an icon + text — never color alone.

## Typography

Inter, loaded via `next/font/google` in `src/app/layout.js`.

| Role | Size |
|---|---|
| Main page title | 32px desktop / 26px mobile |
| Section title | 22px |
| Card title | 18px |
| Body | 15–16px |
| Supporting text | 13–14px |
| Badge text | 12–13px |

Base body font-size is 16px; avoid text below 12px anywhere.

## Spacing, radius, shape

- 8px spacing increments throughout.
- Border radius 14–18px (`--radius-card: 16px`, `--radius-control: 14px`).
- White cards, subtle green-gray borders (`--color-border`), very subtle
  shadows only — no glassmorphism, neon, heavy gradients, or heavy shadows.
- Buttons/major controls ≥44px tall.
- Simple outline icons (`lucide-react`) — no emoji as structural icons.
- Respect `prefers-reduced-motion` (see `globals.css`).

## Information hierarchy — the core rule

> Show the conclusion first, explain the reason second, and reveal
> technical evidence only when the user asks for it.

Every summary card (`RestaurantResultCard`, `DishResultCard`) follows this
fixed order and these limits:

1. Dish or restaurant name
2. Restaurant name or distance (one metadata line)
3. Main compatibility status (`StatusBadge`)
4. One brief plain-language explanation (1–2 sentences)
5. Up to 4 compact badges
6. "Why this result?" (expands in place) and "View details" (navigates)

Never on a compact card: long bullet lists, every allergen assessment, full
evidence descriptions, every source, every confidence value, the full
repeated legal disclaimer. Use `SafetyReminder` (short line) on cards;
reserve the full `SafetyDisclaimer` for Profile onboarding, dish/restaurant
detail pages, and an About/Limitations page.

Detail pages (dish/restaurant) show the user's selected allergens/criteria
first, collapsed by default (`AllergenAssessmentRow`), with an "Other
allergen information" section collapsed by default for anything the user
didn't select. Only real warnings expand automatically.

## Reusable components

`StatusBadge`, `EvidenceBadge`, `AllergenChip`, `DietaryChip`,
`ProfileSummary`, `RestaurantResultCard`, `DishResultCard`,
`ExpandableExplanation`, `AllergenAssessmentRow`, `ScoreSummary`,
`CrossContactNotice`, `SafetyReminder`, `QuestionChecklist`, `EmptyState`,
`LoadingSkeleton`, `ErrorState` — all in `src/components/`. Build new UI
from these rather than one-off markup.
