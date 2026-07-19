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
| Vitest | Unit test runner for `/lib` algorithm functions | MIT | https://vitest.dev | No (dev/test only, not shipped) |
| ESLint + eslint-config-next | Code linting | MIT | https://eslint.org | No (dev only) |

## External services

| Name | Purpose | Terms | Usage | Processes user data? |
|---|---|---|---|---|
| Supabase | Hosted PostgreSQL database, authentication, row-level security | https://supabase.com/terms | Stores user profiles, favorites, and the restaurant/menu dataset | Yes — stores account email, saved allergy/dietary profile, favorites |
| Google Maps JavaScript API | Client-side interactive map rendering and markers | https://cloud.google.com/maps-platform/terms | Renders the map UI in the browser using a restricted (HTTP-referrer-limited, Maps-JS-only) API key | Map tiles are requested by the user's browser directly from Google; see SECURITY_AND_PRIVACY.md |
| Vercel | Hosting/deployment for the Next.js application | https://vercel.com/legal/terms-of-service | Deploys and serves the app | Standard web hosting logs only |
| GitHub | Source control, commit history | https://docs.github.com/site-policy | Stores the project repository | No |

## AI development tools

| Name | Purpose | Terms | Usage |
|---|---|---|---|
| Claude (Anthropic, Claude Code) | Development assistant: planning, code scaffolding, debugging, documentation drafting | https://www.anthropic.com/legal/consumer-terms | See `AI_USAGE.md` for the full log of what was used and how |

## Data sources

Restaurant and menu data sources are documented separately in `DATA_SOURCES.md`, since each individual restaurant/dish has its own source URL, collection date, and reliability rating rather than a single blanket license.

## Fonts / icons / images

_To be filled in as UI components are built. Any icon set or font used will be listed here with its license before it ships._

---

This file is updated whenever a new dependency, API, or external resource is added to the project — not only at submission time.
