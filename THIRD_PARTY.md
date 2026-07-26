# Third-Party Tools and Resources

Every external framework, library, API, hosting service, and dataset used in this project, per the Congressional App Challenge disclosure requirements.

## Frameworks and libraries

| Name | Purpose | License | Source | Processes user data? |
|---|---|---|---|---|
| Next.js 16 | React framework — App Router pages, API route handlers, deployment target | MIT | https://nextjs.org | No (framework only) |
| React 19 / React DOM 19 | UI rendering | MIT | https://react.dev | No |
| Tailwind CSS 4 | Utility-first CSS styling | MIT | https://tailwindcss.com | No |
| @supabase/supabase-js | Supabase client SDK (database queries, auth) | MIT | https://github.com/supabase/supabase-js | Yes — carries requests containing user profile/auth data to Supabase |
| @supabase/ssr | Supabase auth session helpers for server-rendered Next.js | MIT | https://github.com/supabase/ssr | Yes — handles auth session cookies |
| Leaflet | Interactive map rendering (pans/zooms/markers) client-side | BSD-2-Clause | https://leafletjs.com | No — renders OpenStreetMap tiles requested directly by the browser |
| lucide-react | Icon set used throughout the UI | ISC | https://lucide.dev | No |
| Vitest | Unit test runner for `/lib` algorithm functions | MIT | https://vitest.dev | No (dev/test only, not shipped) |
| Playwright | Browser automation used to click-test pages during development | Apache-2.0 | https://playwright.dev | No (dev only, not shipped) |
| ESLint + eslint-config-next | Code linting | MIT | https://eslint.org | No (dev only) |

## External services

| Name | Purpose | Terms | Usage | Processes user data? |
|---|---|---|---|---|
| Supabase | Hosted PostgreSQL database, authentication, row-level security | https://supabase.com/terms | Stores user profiles, favorites, and the restaurant/menu dataset | Yes — stores account email, saved allergy/dietary profile, favorites |
| OpenStreetMap | Map tile imagery for the interactive map (via Leaflet) | https://www.openstreetmap.org/copyright | Renders the map UI in the browser; no API key or account needed. Tile requests go directly from the user's browser to OpenStreetMap's tile servers | Map tiles are requested by the user's browser directly from OpenStreetMap; see SECURITY_AND_PRIVACY.md |
| Vercel | Hosting/deployment for the Next.js application | https://vercel.com/legal/terms-of-service | Deploys and serves the app | Standard web hosting logs only |
| GitHub | Source control, commit history | https://docs.github.com/site-policy | Stores the project repository | No |

## AI development tools

| Name | Purpose | Terms | Usage |
|---|---|---|---|
| Claude (Anthropic, Claude Code) | Development assistant: planning, code scaffolding, debugging, documentation drafting | https://www.anthropic.com/legal/consumer-terms | See `AI_USAGE.md` for the full log of what was used and how |

## Data sources

Restaurant and menu data sources are documented separately in `DATA_SOURCES.md`, since each individual restaurant/dish has its own source URL, collection date, and reliability rating rather than a single blanket license.

## Fonts / icons / images

- **Fonts:** Inter (app-wide) and Lora (serif headings on Home/Profile only), both loaded via `next/font/google` (self-hosted by Next.js at build time — no runtime request to Google, no separate license file needed beyond Google Fonts' own open-license terms for these typefaces).
- **Icons:** [`lucide-react`](https://lucide.dev/) (ISC license), used throughout for simple outline icons instead of emoji or a custom icon asset.
- **Images:** `public/images/home-hero.png`, a food photo shown on the Home screen, supplied directly by the user in chat. **Its original source/license has not been verified** — before this app is submitted or deployed publicly, confirm the image is either the user's own work, appropriately licensed stock photography, or otherwise cleared for use, and update this entry with that source.

---

This file is updated whenever a new dependency, API, or external resource is added to the project — not only at submission time.
