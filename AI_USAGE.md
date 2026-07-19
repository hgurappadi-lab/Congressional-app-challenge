# AI Usage Log

This project used Claude (Anthropic) as a development assistant. This log records every meaningful use, per the Congressional App Challenge AI-use disclosure requirements. Entries are added continuously during development, not reconstructed at the end.

For each entry: date, tool, what was asked, what Claude produced, what I (the student) changed or decided, what I tested, and what I learned.

---

## 2026-07-19 — Product concept review and Congressional App Challenge requirements

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** I provided a detailed product concept for an allergy-aware food discovery app, and the full 2026 Congressional App Challenge rules (eligibility, AI-use disclosure requirements, judging criteria, required documentation, submission timeline). Asked Claude to internalize the competition constraints before any building started.

**Assistance provided:** Claude summarized the competition's implications for the build (documentation requirements, AI-disclosure rules, data-sourcing/legal constraints, timeline), and asked clarifying questions rather than assuming a tech stack or data strategy.

**My contribution / decisions:** I made the calls on: solo entry, my own coding background, real-vs-mock location data, and — most substantively — I personally rewrote and significantly expanded Claude's first-draft build plan into a much more precise one: I introduced the seven-value allergen assessment taxonomy (`restaurant_disclosed_contains` / `official_guide_contains` / `ingredient_explicitly_listed` / `possible_based_on_description` / `not_identified_in_available_source` / `restaurant_disclosed_absent` / `unknown`), the matching-strictness system (`standard` / `cautious` / `cross_contact_sensitive`), the decision to manually curate real restaurant/menu data rather than bulk-import via Google Places, and the `item_dietary_attributes` table design separating halal/kosher certification from plain ingredient inference. Claude adopted my plan as the plan of record over its own draft.

**Tested:** N/A (planning only, no code yet).

**What I learned:** Why absence-of-mention can't be treated as evidence of absence for an allergen app, and why Halal/Kosher need a certification-and-preparation model rather than simple ingredient filtering.

**Retained/modified/discarded:** My revised plan was retained in full as `/Users/harshag/.claude/plans/federated-swimming-fountain.md`, superseding Claude's initial draft.

---

## 2026-07-19 — Project scaffolding

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Initial Next.js project setup: framework scaffold, dependency install, folder structure, environment variable template, and this documentation suite.

**Assistance provided:** Claude ran `create-next-app` (App Router, JavaScript, Tailwind CSS v4), installed `@supabase/supabase-js`, `@supabase/ssr`, and `vitest`, created the `/lib`, `/scripts`, `/data/seed`, `/tests`, and route-group folder structure matching the approved plan, wrote `.env.example` with inline comments explaining each variable's security posture, and drafted the initial versions of README.md, ARCHITECTURE.md, DATA_SOURCES.md, TESTING.md, SECURITY_AND_PRIVACY.md, LIMITATIONS.md, THIRD_PARTY.md, and LICENSE.

Claude also read the Next.js 16 docs bundled in `node_modules/next/dist/docs/` before writing any app code, since this Next.js version (16) postdates its training data and has breaking changes (async `params`/`searchParams`, route handler conventions, `fetch` caching defaults, `middleware.js` → `proxy.js`).

**My contribution:** [Fill in as you review the scaffold — e.g., which defaults you changed, which folder names you adjusted.]

**Tested:** [Fill in once `npm run dev` has been run and the default page confirmed loading.]

**What I learned:** [Fill in — e.g., how Next.js App Router route groups `(name)` organize URLs without affecting the path, or how async params work in Next 16.]

**Retained/modified/discarded:** Scaffold retained; documentation stubs will be filled in with real content as each corresponding feature is built, per the plan's Phase 10.

---

## 2026-07-19 — GitHub repo + database schema + Supabase auth + guest mode

**Tool:** Claude (Sonnet 5, via Claude Code)

**Purpose:** Push the scaffold to a real GitHub repository, design and write the full Postgres schema, and wire up Supabase authentication plus a no-account guest mode.

**Assistance provided:** Claude added the `git@github.com:hgurappadi-lab/Congressional-app-challenge.git` remote and pushed (after I created the repo myself and set my real git commit identity). It wrote `supabase/schema.sql` implementing the table design and evidence/allergen-assessment vocabulary I specified in the plan, using CHECK constraints (not native Postgres enums) so the vocabulary stays easy to extend, plus Row Level Security policies (private `profiles`/`favorites`, public-read/service-role-write everything else). It also wrote the Supabase client helpers (`src/lib/supabase/{client,server,admin}.js`), a `src/proxy.js` session-refresh handler (verified against the actual Next.js 16 docs, not assumed, since `middleware.js` was renamed to `proxy.js` in this version), sign up/in/out pages and an email-confirmation callback route, and `src/lib/profile.js` for localStorage-backed guest profiles.

**My contribution:** [Fill in — e.g., any schema fields you added/changed after creating your real Supabase project, any RLS policy you tightened, any UI text you rewrote.]

**Tested so far:** Local build (`npm run build`), lint (`npm run lint`), and unit test pipeline (`npm test`) all pass. The schema and auth flow have **not** yet been run against a live Supabase project — that requires the Supabase project to exist first with real credentials in `.env.local`. [Fill in once you've run `schema.sql` in the Supabase SQL editor and manually tested sign-up/confirm/sign-in/sign-out.]

**What I learned:** [Fill in — e.g., why RLS policies are written per-operation (select/insert/update/delete) rather than one blanket policy, or how the service-role key bypasses RLS and why that means it must never reach the browser.]

**Retained/modified/discarded:** All retained pending live testing once Supabase credentials are available.
