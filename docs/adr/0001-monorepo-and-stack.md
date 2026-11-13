# ADR 0001 — Monorepo and stack

- **Status:** Accepted
- **Date:** 2026-11-13

## Context

Waitless is one product with three consumers of the same domain rules: the patient
app, the hospital staff app, and the hardware bridge. Status values, transition
rules and timezone maths must not drift between them. The demo also needs to be
runnable by a single person on Windows with Docker Desktop and no paid services.

## Decision

1. **One repository, pnpm workspaces + Turborepo.**
   - `apps/api` (Express 5 + TypeScript), `apps/web` (React 19 + Vite),
     `packages/shared` (pure domain logic).
   - `packages/shared` is consumed as TypeScript source. The API bundles it with
     tsup (`noExternal`); Vite compiles it directly. There is no separate build
     step, so a change to the state machine is immediately visible everywhere.
2. **Single `.env` at the repository root.** One source of truth for local
   configuration. Prisma CLI cannot see it from `apps/api`, so db scripts run
   through `apps/api/scripts/with-env.mjs`.
3. **PostgreSQL + Prisma 6.** The queue, swap and audit data is relational and
   benefits from transactions and unique constraints. Prisma 6 is pinned because
   v7/v8 change the generator and config model without adding value here.
4. **Redis + BullMQ** for delayed work (30-minute alerts, grace timers, swap
   expiry). Redis is already needed for rate limiting and socket fan-out.
5. **Socket.IO** for live queue updates; REST remains the source of truth.
6. **No OTP in the first release.** Patients sign in with full name + mobile
   number behind a `PatientAuthProvider` seam so SMS OTP can be added later.
7. **Single hospital.** No `hospitalId` column; adding tenancy later is a
   mechanical migration, and premature scoping would slow every query.

## Consequences

- **Positive:** shared enums and the transition table are compiled into both
  apps; one `pnpm dev` boots everything; CI caching is straightforward.
- **Negative:** workspace TypeScript consumption means the API build must bundle
  the shared package (configured in `tsup.config.ts`), and editors must resolve
  the package through pnpm symlinks.
- **Watch out:** the root `.env` must be loaded explicitly by every CLI tool.
  Use the `with-env.mjs` wrapper rather than adding dotenv calls per package.
