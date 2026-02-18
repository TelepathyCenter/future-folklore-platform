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

### Next Up

- **Layer 1.1** — Supabase Auth (email/password + Google/GitHub OAuth)
- **Layer 1.2** — Community profile pages (view/edit)
- **Layer 1.3** — Project directory (browse, detail pages)
- **Layer 1.4** — Weekly calls (scheduling, notes)

## Known Issues

- Next.js 16 warns about `middleware.ts` deprecation (use `proxy` instead) — Supabase SSR hasn't updated yet, safe to ignore for now
- `@supabase/ssr` `setAll` callback needs explicit typing in strict TypeScript mode
- `nx sync` must be run after adding new workspace dependencies
