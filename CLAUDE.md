# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# VEKTOR

## Product Canon

@docs/product-canon.md

The Product Canon is the highest authority for product decisions. No implementation may contradict it.

**Governance (frozen as of Blueprint v1.0):** Product Canon → Product Blueprint (`docs/product-blueprint.md`) → RFCs (`docs/rfc/`) → Implementation. The Blueprint is frozen — it changes only via a new decision recorded in `docs/DECISIONS.md`. All functional product evolution happens through RFCs, never by editing the Canon or Blueprint directly. See `docs/architecture/` for the domain, navigation, and AI reference derived from the Blueprint.

## Product Vision

VEKTOR is an AI-native Marketing Operating System.

"Business Operating System" is reserved for a possible future evolution of the platform beyond marketing — not the current product identity.

The platform is modular, multi-tenant and AI-first.

Each company owns one Workspace.

Each Workspace runs a single continuous cycle — Estratégia → Execução → Growth → Aprendizado → Evoluir Estratégia — never a set of independent modules. Modules are interdependent stages of that one cycle, not standalone apps.

Artificial Intelligence is a native capability across the entire platform.

## Product Philosophy

VEKTOR is not a collection of isolated applications. It is a unified Marketing Operating System.

Every module must integrate naturally with the platform through shared authentication, permissions, navigation, AI capabilities and design system.

When proposing new features, always prefer extending the platform instead of creating isolated solutions.

---

## Product Model

Full detail lives in the VEKTOR Product Blueprint v1 (7 chapters: Product Vision, Product Strategy, Product Architecture, UX Blueprint, Marketing Planning Framework, Growth Framework, Roadmap). This section is the load-bearing summary for implementation work.

Seven modules, each serving one moment of the cycle: Estratégia, Execução, Growth, Aprendizado, Relatórios, Biblioteca, Configurações.

- Dashboard is not a module — it's the composed Workspace-level (global-context) view.
- "Evoluir Estratégia" is not a module — it's an action triggered from within Aprendizado.
- Relatórios has two views: scoped to the active Estratégia, and historical/comparative across the Workspace's Estratégias.
- "Growth" (the module) and "Growth Framework" (the end-to-end process spanning Execução → Growth → Aprendizado) are not the same thing — don't conflate them in naming.

Domain entity chain: Workspace → Estratégia → Campanha → Tática → Ação → Evidência → Hipótese → Experimento (runs inside a Tática/Ação, justified by a Hipótese) → Aprendizado → feeds the next Estratégia. Entity names are always singular, even for accumulated instances.

Two navigation contexts, never confused: **Contexto Global** (Workspace — permanent, holds full history) and **Contexto Estratégico** (Estratégia Ativa — where the user works day to day). When a Estratégia evolves: the previous one closes, stays consultable and comparable, and never receives new execution again — all execution happens only in the active Estratégia.

No operation is ever created outside a Estratégia — there is no "+ Nova Campanha" independent of one.

---

## Architecture Principles

- Enterprise-grade architecture.
- Clean Architecture and Domain-Driven Design (DDD), applied where they add value.
- Modular design, favoring decoupled components.
- Strong typing.
- Security by default.
- Performance first.
- Documentation first.
- Reusable components.
- High scalability, with multi-tenant SaaS growth in mind.

---

## Technology Stack

Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

Monorepo
- Turborepo
- PNPM Workspaces

Backend
- Next.js Route Handlers
- Supabase

Database
- PostgreSQL (Supabase)

ORM
- Drizzle ORM

Validation
- Zod

State
- TanStack Query
- Zustand only when necessary

AI
- Anthropic Claude
- OpenAI
- Vercel AI SDK

Deployment
- Vercel

---

## Code Quality

Prefer:

- composition over inheritance;
- server components whenever appropriate;
- server actions when they simplify the architecture;
- feature-based organization;
- shared UI components;
- strict TypeScript;
- accessibility by default;
- responsive interfaces;
- high performance.

Avoid:

- premature optimization;
- unnecessary abstractions;
- duplicated business logic;
- tightly coupled modules.

---

## Engineering Rules

Always:

- ask for approval before creating large structures or installing new dependencies;
- keep architecture consistent;
- keep solutions simple, avoiding overengineering;
- document important architectural decisions;
- ask for clarification when business requirements are ambiguous — never assume them;
- consider scalability for a multi-tenant SaaS system.

Never:

- introduce new dependencies without justification;
- change architecture without approval;
- generate unnecessary files.

---

## Development Workflow

For every significant task:

1. Analyze the request.
2. Present a concise implementation plan.
3. Wait for approval before making major architectural changes.
4. Implement in small, reviewable steps.
5. Validate the result.
6. Summarize what changed.
