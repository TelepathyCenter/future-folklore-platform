# Future Folklore Platform

## Project Overview

Frontier science research incubator platform. Digitizes Future Folklore's operations (community profiles, project directory, weekly calls, resource library) and expands into full research infrastructure (blockchain timestamping, phenomenological data capture, knowledge graph, AI agents, DeSci governance).

## Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript 5.9 |
| Backend  | FastAPI + Python 3.11+                              |
| Database | Supabase (Postgres 16 + pgvector)                   |
| Monorepo | Nx 22 + pnpm                                        |
| Testing  | Jest (frontend) + Pytest (backend)                  |
| Linting  | ESLint (frontend) + Ruff (backend)                  |
| CI       | GitHub Actions                                      |

## Monorepo Structure

```
apps/web/          — Next.js frontend
apps/api/          — FastAPI backend
packages/shared/   — Shared TS types, constants, validation
packages/db/       — Database schemas, migrations
infra/             — Docker Compose, Dockerfiles
```

## Nx Commands

```bash
nx dev web          # Next.js dev server (:3000)
nx serve api        # FastAPI dev server (:8000)
nx test web         # Jest tests
nx test api         # Pytest
nx lint web         # ESLint
nx lint api         # Ruff
nx affected -t test # Only test changed projects
```

## Supabase

- **Project ID**: `elndhznjnexzutammxdf`
- **Region**: us-east-2
- **URL**: `https://elndhznjnexzutammxdf.supabase.co`
- **Org**: The Telepathy Center
- **Tables**: profiles, organizations, projects, memberships
- **Enums**: membership_role, profile_role, profile_visibility, project_status, project_visibility
- **RLS**: 19 policies with tiered access (public/community/incubator)
- **Trigger**: handle_new_user() auto-creates profile on signup
- **Types**: Auto-generated via `pnpm db:typegen` or Supabase MCP → `packages/db/src/database.types.ts`

## Conventions

- All Supabase tables use RLS, UUID PKs, timestamptz columns
- API routes under `/api/` prefix
- Environment variables in `.env` (never committed), template in `.env.example`
- Python: type hints required, Ruff for linting/formatting
- TypeScript: strict mode, no `any`
- Feature branches, conventional commits, PR reviews

## Development Roadmap

See `DEVELOPMENT_OUTLINE.yaml` in the project's Claude Code config for the full 7-layer development plan.

### Completed

- **Layer 0.1** — Repo, monorepo scaffold, CI (commit `ad8a762`)
- **Layer 0.2** — Supabase project, base schema migration, auth clients, generated types (commit `7a53917`)
- **Step 0.3** — Hosting pipeline: vercel.json, railway.toml, CORS config, Dockerfile.web fix (commit `38b741a`)
- **Step 0.4** — Design system: Tailwind v4, shadcn/ui primitives, branded landing page, layout shell (commit `5edc6b3`)
- **Step 1.1** — Auth + profiles: email/password + OAuth sign-in, profile view/edit, community directory with search/filter (commit `30e066a`)
- **Deployment** — Vercel (frontend) + Railway (backend) + Supabase OAuth (Google/GitHub) live (commit `1204ffe`)

### Next Up

- **Layer 1.3** — Project directory (browse, detail pages)
- **Layer 1.4** — Weekly calls (scheduling, notes)
- **Layer 2** — Blockchain timestamping, knowledge graph

## Design System

- **CSS**: Tailwind v4 with `@theme` block (deep space + amber gold + electric blue palette)
- **Components**: shadcn/ui pattern (CVA + Radix primitives) — button, input, label, card, avatar, separator, badge, toast
- **Layout**: AppShell (top-nav + sidebar + main), PageContainer
- **Font**: Inter (Google Fonts CDN)
- **Auth**: Supabase SSR cookie pattern, Server Actions, middleware route protection

## Hosting

- **Frontend**: Vercel — https://future-folklore-platform.vercel.app (GitHub auto-deploys enabled)
- **Backend**: Railway — https://api-production-0d93.up.railway.app (project: `c03446ae-721b-4bf6-ab71-a830e896da1a`, service: `api`)
- **Auth**: Supabase Auth with Google + GitHub OAuth enabled
- **CORS_ORIGINS** env var must be JSON array format (pydantic-settings v2 requirement): `["https://...", "http://..."]`
- `railway.toml` must be at repo root (not in `apps/api/`) for Railway to detect it

## Known Issues

- Next.js 16 warns about `middleware.ts` deprecation (use `proxy` instead) — Supabase SSR hasn't updated yet, safe to ignore for now
- `@supabase/ssr` `setAll` callback needs explicit typing in strict TypeScript mode
- `nx sync` must be run after adding new workspace dependencies
- Supabase PostgREST v14 types cause `never` inference on `.update().eq()` chains — use `as any` on `supabase.from()` as workaround
