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

## Conventions

- All Supabase tables use RLS, UUID PKs, timestamptz columns
- API routes under `/api/` prefix
- Environment variables in `.env` (never committed), template in `.env.example`
- Python: type hints required, Ruff for linting/formatting
- TypeScript: strict mode, no `any`
- Feature branches, conventional commits, PR reviews

## Development Roadmap

See `DEVELOPMENT_OUTLINE.yaml` in the project's Claude Code config for the full 7-layer development plan.

Current focus: Layer 0 (bootstrap) → Layer 1 (current operations online).
