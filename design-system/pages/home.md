# Home — page-specific overrides

Deviations from `design-system/MASTER.md`, requested directly by the user via
a reference mockup (2026-07-23). Every other page still follows MASTER.md
exactly — these overrides are scoped to `src/app/home/HomePageClient.js` only.

- **Heading font:** `Lora` (serif, via `next/font/google`), used only for the
  hero `<h1>` and the two action-card titles — body text, nav, and every
  other page stay on Inter.
- **Background:** a soft warm-to-page gradient (`from-[#f6efe2] via-page
  to-page`) plus a decorative primary-green wave SVG at the bottom of the
  page, instead of the flat `--color-page` background MASTER.md specifies
  elsewhere.
- **Hero image:** borderless, `object-contain` on a transparent background
  (not the rounded bordered card treatment used for images elsewhere).
- **Profile summary:** shown as a small pill in the header (leaf icon +
  allergen list + chevron, linking to `/profile`) rather than a plain text
  line — this is actually a MASTER.md-compliant progressive-disclosure
  pattern (compact, glanceable, drills into the full profile on tap), just
  styled to match this page's richer visual treatment.
- **Decorative illustrations:** simple inline SVGs (rolling hills / dish
  cloche) faded into the bottom of each action card. Decorative only
  (`aria-hidden`), not part of the reusable component library.

If this direction is liked, the natural next step would be extending the
serif/gradient treatment to other pages' headings for consistency — ask
before doing that broadly, since MASTER.md currently documents Inter-only
as the app-wide rule.
