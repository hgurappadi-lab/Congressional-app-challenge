# Profile — page-specific overrides

Deviations from `design-system/MASTER.md`, requested directly by the user
via a reference mockup (2026-07-23), matching the same treatment already
applied to Home (see `design-system/pages/home.md`). Scoped to
`src/app/(onboarding)/profile/page.js` only.

- **Heading font:** shares the `lora` instance from `src/lib/fonts.js` (same
  one Home uses) for the page title and each section heading.
- **Background:** soft green-to-page gradient plus two large low-opacity
  `Leaf` icons in the corners, instead of the flat `--color-page` background.
- **Whole-page card:** all sections live inside one large rounded white
  card, rather than sections directly on the page background.
- **Allergen/dietary chips:** `AllergenChip`/`DietaryChip` gained an
  optional `icon` prop (backward compatible) so each allergen/restriction
  shows a small representative icon (from `lucide-react`, mapped in
  `src/lib/profile-options.js`) alongside its label.
- **Matching-strictness options:** each option row gained a decorative
  tinted icon on the right (`StrictnessIllustration`, local to this page) —
  green shield for Standard caution, amber search for Extra cautious,
  violet people icon for Cross-contact sensitive. These three tint colors
  aren't part of MASTER.md's 5-way status system (they're purely
  decorative grouping, not classification status) — using plain Tailwind
  `amber-*`/`violet-*` here rather than adding new design tokens for a
  one-page decoration.
- **`ProfileSummary`** gained an optional `className` prop (backward
  compatible, defaults to its original styling) so this page can render it
  in a green "confirmation" box instead of plain text.
- **`SafetyDisclaimer`** gained a small leading `Info` icon — this change
  is *not* page-scoped, since the component is shared with restaurant/dish
  detail pages and the icon addition works fine there too.
