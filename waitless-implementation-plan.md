# Waitless â€” Implementation Plan & Progress Tracker

Smart hospital appointment, queue and notification platform.

**Project root:** `D:\Self project\wait-less`
**Plan file:** `C:\Users\rohan\.opencode\plan\waitless-implementation-plan.md`
**Created:** 2026-11-13
**Owner:** Rohan

---

## 0. How to use this file

1. Work top-to-bottom. Phases are ordered by dependency, not by importance.
2. Every task is a checkbox. Tick it **only** when its "done when" condition is verifiably true.
3. Keep the **Status Board** (section 2) up to date â€” that is the single source of truth for progress.
4. Add a line to **Change Log** (section 14) whenever a phase is completed or a decision changes.
5. Never start a phase before the previous phase's exit criteria are green, except for explicitly marked "parallel-safe" tasks.

Legend: `[ ]` not started Â· `[~]` in progress (write it as `[~]`) Â· `[x]` done Â· `[!]` blocked (add a note)

---

## 1. Locked decisions (from planning Q&A)

| Decision | Choice | Rationale |
|---|---|---|
| Repo layout | pnpm workspaces + Turborepo monorepo | Shared TypeScript types between web/api; cached lint/test/build |
| Node package manager | **pnpm** (install via `corepack enable pnpm`) | Turborepo-first workflow, strict workspace resolution |
| Patient identity | **No OTP for now.** Patient enters full name + mobile number and is signed in | Fastest path to a usable demo; upgrade path kept open |
| Patient auth upgrade path | Abstracted behind `PatientAuthProvider` (`mock` now, `sms-otp` later) | Swapping in OTP touches one module, not every route |
| Tenancy | Single hospital | No `hospitalId` scoping; can be added later with a migration |
| Backend | Node 22 + Express 5 + TypeScript | Matches stated stack |
| DB / ORM | PostgreSQL 16 + Prisma 6 | Relational queue/state data, transactions for swaps |
| Realtime | Socket.IO (rooms per doctor + per patient) | Live queue updates |
| Cache / jobs | Redis 7 + BullMQ | Scheduled 30-min alerts, grace-period timers, swap expiry |
| Frontend | React 19 + Vite + TS + Tailwind v4 + shadcn/ui | Unchanged from spec |
| Notifications | In-app + browser push (FCM) first; SMS/WhatsApp adapters deferred | No provider billing during build |
| Hardware | MQTT (Mosquitto in compose) + HTTP fallback | NXP board only publishes occupancy events |
| AI/RAG | Not built; interface stubbed only | Phase 7 |

**Ports:** web `5173`, api `4000`, postgres `5432`, redis `6379`, mosquitto `1883`, mqtt-ws `9001`.
**API base path:** `/api/v1` (versioned from day one).

---

## 2. Status board

| # | Phase | Status | Est. effort | Started | Completed |
|---|---|---|---|---|---|
| 1 | Foundation & tooling | `[x]` | 2â€“3 days | 2026-11-13 | 2026-11-13 |
| 2 | Database & domain model | `[x]` | 2 days | 2026-11-13 | 2026-11-13 |
| 3 | Auth (admin + patient) & RBAC | `[ ]` | 2 days | â€” | â€” |
| 4 | Hospital management (departments, doctors, schedules) | `[x]` | 3â€“4 days | 2026-11-13 | 2026-11-13 |
| 5 | Appointment booking (QR + remote) | `[~]` | 4 days | 2026-11-13 | — |
| 6 | Queue engine | `[ ]` | 5 days | â€” | â€” |
| 7 | Real-time layer & notifications | `[ ]` | 4 days | â€” | â€” |
| 8 | Appointment swap | `[ ]` | 2â€“3 days | â€” | â€” |
| 9 | Hardware integration (NXP FRDM-MCXN236) | `[ ]` | 5 days | â€” | â€” |
| 10 | Admin analytics, hardening, demo polish | `[ ]` | 3â€“4 days | â€” | â€” |
| 11 | Future scope (RAG chatbot, multi-tenancy) | `[ ]` | â€” | â€” | â€” |

**Overall progress:** 3 / 11 phases complete, 1 in progress (Phase 5) · ~68 / 205 tasks (approx, see phase checklists)

---

## 3. Target repository layout

```
wait-less/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/                     # Express + TS
â”‚   â”‚   â”œâ”€â”€ prisma/
â”‚   â”‚   â”‚   â”œâ”€â”€ schema.prisma
â”‚   â”‚   â”‚   â”œâ”€â”€ migrations/
â”‚   â”‚   â”‚   â””â”€â”€ seed.ts
â”‚   â”‚   â””â”€â”€ src/
â”‚   â”‚       â”œâ”€â”€ config/          # env, prisma client, redis, logger
â”‚   â”‚       â”œâ”€â”€ middleware/      # auth, rbac, validate, error, rate-limit
â”‚   â”‚       â”œâ”€â”€ modules/
â”‚   â”‚       â”‚   â”œâ”€â”€ auth/
â”‚   â”‚       â”‚   â”œâ”€â”€ patients/
â”‚   â”‚       â”‚   â”œâ”€â”€ admins/
â”‚   â”‚       â”‚   â”œâ”€â”€ departments/
â”‚   â”‚       â”‚   â”œâ”€â”€ doctors/
â”‚   â”‚       â”‚   â”œâ”€â”€ appointments/
â”‚   â”‚       â”‚   â”œâ”€â”€ queue/
â”‚   â”‚       â”‚   â”œâ”€â”€ notifications/
â”‚   â”‚       â”‚   â”œâ”€â”€ swaps/
â”‚   â”‚       â”‚   â”œâ”€â”€ hardware/
â”‚   â”‚       â”‚   â”œâ”€â”€ analytics/
â”‚   â”‚       â”‚   â””â”€â”€ health/
â”‚   â”‚       â”œâ”€â”€ jobs/            # bullmq workers + schedulers
â”‚   â”‚       â”œâ”€â”€ sockets/         # io server, rooms, emitters
â”‚   â”‚       â”œâ”€â”€ integrations/    # fcm, mqtt, sms(adapter), qr
â”‚   â”‚       â”œâ”€â”€ utils/           # time, tokens, errors, pagination
â”‚   â”‚       â”œâ”€â”€ app.ts
â”‚   â”‚       â””â”€â”€ server.ts
â”‚   â””â”€â”€ web/                     # React + Vite + Tailwind + shadcn
â”‚       â””â”€â”€ src/
â”‚           â”œâ”€â”€ components/ (ui/, patient/, admin/, shared/)
â”‚           â”œâ”€â”€ layouts/ (PatientLayout, AdminLayout, AuthLayout)
â”‚           â”œâ”€â”€ pages/
â”‚           â”‚   â”œâ”€â”€ public/      # Landing, Login, Register, ScanBooking
â”‚           â”‚   â”œâ”€â”€ patient/     # Home, Book, MyAppointments, QueueStatus, SwapRequests
â”‚           â”‚   â””â”€â”€ admin/       # Dashboard, Departments, Doctors, Appointments, Queue, Patients, Swaps, Settings
â”‚           â”œâ”€â”€ hooks/ services/ context/ routes/ lib/ types/
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ shared/                  # zod schemas, DTOs, enums, constants, status machine labels
â”‚   â””â”€â”€ config/                  # shared tsconfig / eslint / tailwind preset
â”œâ”€â”€ hardware/
â”‚   â”œâ”€â”€ firmware/                # NXP FRDM-MCXN236 (CMSIS/FreeRTOS scaffolding later)
â”‚   â”œâ”€â”€ simulator/               # node script publishing fake occupancy events
â”‚   â””â”€â”€ docs/                    # wiring, topics, payload spec
â”œâ”€â”€ docs/                        # ADRs, api.md, state-machine.md, runbook.md
â”œâ”€â”€ docker-compose.yml           # postgres, redis, mosquitto, mailpit(optional)
â”œâ”€â”€ turbo.json
â”œâ”€â”€ pnpm-workspace.yaml
â”œâ”€â”€ package.json
â”œâ”€â”€ .env.example
â”œâ”€â”€ .gitignore
â””â”€â”€ README.md
```

---

## 4. Phase 1 â€” Foundation & tooling

**Goal:** one command boots the whole stack; CI is green; nothing is implemented yet.

### 1.1 Repo & tooling
- [x] `git init`, add `.gitignore` (node_modules, dist, .env, coverage, prisma dev db, .turbo)
- [x] `corepack enable pnpm && pnpm init`; create `pnpm-workspace.yaml` with `apps/*`, `packages/*` (pnpm installed globally; corepack enable hit EPERM on this machine)
- [x] Add `turbo.json` with pipelines: `build` (dependsOn `^build`), `dev` (cache false, persistent), `lint`, `test`, `typecheck`, `db:generate`
- [x] Root `package.json` scripts: `dev`, `build`, `lint`, `test`, `typecheck`, `format`, `db:migrate`, `db:seed`, `db:reset`, `db:ping`
- [x] `.nvmrc` / `engines` pin to Node 22; `packageManager` field set to pnpm version
- [x] Prettier + ESLint (flat config) + `eslint-plugin-react-hooks`/`react-refresh` (no `simple-import-sort`)
- [x] `.env.example` with environment variables (kept in sync with `config/env.ts`; section 12 can be reconciled in hardening)
- [x] README with prerequisites, install, run, and troubleshooting sections

**Done when:** `pnpm install` succeeds; `pnpm lint` and `pnpm typecheck` pass on the scaffold.

### 1.2 Infrastructure
- [x] `docker-compose.yml`: `postgres:16-alpine` (named volume, healthcheck), `redis:7-alpine`, `eclipse-mosquitto:2` with `mosquitto.conf` (anonymous access enabled for local dev; ACLs planned for Phase 9)
- [x] Verify `docker compose up -d` and `pnpm db:ping` succeed

**Done when:** infra up, `pnpm db:ping` returns `{"db":"up","redis":"up"}`, API `/api/v1/health` and `/health/ready` respond OK.

### 1.3 API skeleton
- [x] `apps/api` scaffold: `tsx watch` dev, `tsup` build, `zod`, `pino`/`pino-http`, `helmet`, `cors`, `compression`, `cookie-parser`, Socket.IO
- [x] `app.ts` composes routers; `server.ts` binds port and starts socket server
- [x] Error handling: `AppError` class, `notFound` + `errorHandler` middleware, consistent error envelope `{ error: { code, message, details? } }`
- [x] Request logging with request id; `GET /api/v1/health` implemented
- [x] `GET /api/v1/health/ready` checks DB + Redis

**Done when:** health endpoints respond; logs are structured; DB/Redis readiness verified.

### 1.4 Web skeleton
- [x] `apps/web` with Vite React-TS, Tailwind v4 (`@tailwindcss/vite`), path alias `@/`
- [x] shadcn-style components + `components.json`: button, input, card, dialog, select, table, badge, toast (sonner), tabs, label, skeleton, separator
- [x] React Router with `PublicLayout`, `PatientLayout`, `AdminLayout`, placeholder pages (all patient/admin routes)
- [x] TanStack Query provider + `lib/api.ts` fetch wrapper with error normalization
- [x] Vite dev proxy `/api` â†’ `http://localhost:4000` and `/socket.io`
- [x] Theme tokens (clinical teal palette), favicon, metadata

**Done when:** layouts/routes render; landing/admin pages show API status via TanStack Query hook.

### 1.5 Quality gates
- [x] `packages/shared` created and consumed by api + web (enums, errors, domain logic)
- [x] Vitest configured in api + web (jsdom + Testing Library for web smoke test)
- [x] GitHub Actions `ci.yml`: pnpm install (cache), generate, lint, typecheck, test, build
- [x] `docs/adr/0001-monorepo-and-stack.md` added

**Done when:** root `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` are green locally.

---

## 5. Phase 2 â€” Database & domain model

**Goal:** the schema is stable enough that Phases 3â€“8 never need destructive changes.

### 2.1 Prisma setup
- [x] `datasource db` + `generator client` (Prisma 6.19.3 pinned; root `.env` loaded via `apps/api/scripts/with-env.mjs`)
- [x] Initial migration applied (`20261113062214_init`) + partial-unique swap indexes (`20261113062500_swap_pending_unique`)
- [x] Prisma client singleton in `src/config/prisma.ts` (dev hot-reload safe)
- [x] Migration/db conventions documented in `docs/db.md`

**Done when:** migrations apply; `pnpm db:seed` runs idempotently for structural rows and refreshes tagged demo-day data.

### 2.2 Enums (single source of truth)
- [x] Enums defined in `schema.prisma` and mirrored as const arrays + zod enums in `packages/shared/src/enums.ts`
- [x] `docs/state-machine.md` added (transition table + mermaid)
- [x] API drift test `apps/api/test/enum-drift.test.ts` asserts Prisma/shared enums match

### 2.3 Models
- [x] Full domain schema implemented (User/Patient/AdminProfile/RefreshToken, Department/Doctor/Room/DoctorSchedule/ScheduleException, Appointment/QueueEntry/Consultation, Notification/NotificationPreference, SwapRequest, HardwareEvent, AuditLog)
- [x] Relations and delete rules chosen; slot/day/token uniqueness constraints added; `serviceDay` stored for daily queues
- [x] Token generation strategy: per doctor per day, generated at booking/seed
- [x] Seed data: 2 staff accounts, 5 departments, 8 doctors + rooms + weekly schedules, 6 patients, demo-day appointments/queue entries (incl. in-consultation, called, delayed, notified, pending swap) + history/notifications

**Done when:** `pnpm db:seed` succeeds; demo data visible in Prisma Studio.

### 2.4 Domain layer
- [x] State machine in `packages/shared/src/state-machine.ts` (`assertTransition`, `canTransition`, `canCancel`, `isTerminal`)
- [x] Timezone/slot helpers in `packages/shared/src/time.ts` and `packages/shared/src/slots.ts`
- [x] Unit tests for transitions, time, and slots â€” 42 tests passing in shared, 9 in api

**Done when:** legal/illegal transitions and core time/slot behavior covered by tests.

---

## 6. Phase 3 â€” Authentication & RBAC

**Goal:** admin logs in with credentials; patient signs in with name + mobile; every route is protected by role.

### 3.1 Admin auth
- [ ] `POST /api/v1/auth/login` â€” email/phone + password â†’ access token (15 min) + refresh token (httpOnly cookie, 7 days)
- [ ] `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- [ ] Argon2id password hashing; login rate limit (5/min/IP + per-account lockout)
- [ ] Seed script creates first admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`

**Done when:** wrong password â†’ 401 with generic message; 6th attempt within a minute â†’ 429; refresh rotates the token and revokes the old hash.

### 3.2 Patient auth (no OTP)
- [ ] `POST /api/v1/patients/session` â€” body `{ fullName, phone }` â†’ finds-or-creates `User(role=PATIENT)` + `Patient`, sets `phoneVerified=false`, returns patient access token + profile
- [ ] Phone normalization (E.164-ish, strip spaces/dashes, require 10 digits for IN) + zod validation
- [ ] Same phone returns the same patient (no duplicates); name update allowed on subsequent sign-in
- [ ] `PatientAuthProvider` interface with `mock` implementation; `sms-otp` stub throws `NotImplemented` with a code comment on where OTP lands
- [ ] `GET /api/v1/patients/me`, `PATCH /api/v1/patients/me` (name/email only, phone change requires future OTP)

**Done when:** signing in twice with `"Rohan" / "9876543210"` and `"Rohan S" / "98765 43210"` resolves to one patient; a patient token cannot hit admin routes; `phoneVerified` is false and surfaced in the UI as "verify later".

### 3.3 RBAC & middleware
- [ ] `authenticate` (JWT verify, attach `req.auth = { userId, role, patientId? }`)
- [ ] `authorize(...roles)` guard; `requirePatientSelf` guard for `:patientId` routes
- [ ] Ownership rules for appointments/queue/swaps: patient may only read/act on own records
- [ ] `validate(schema, 'body' | 'query' | 'params')` middleware backed by shared zod schemas
- [ ] `POST /api/v1/staff/session`? â†’ **not needed**; staff reuse admin login with `role=STAFF` and limited permissions (matrix in `docs/rbac.md`)
- [ ] `docs/rbac.md`: matrix of endpoint Ã— role

**Done when:** an automated table-driven test hits every route with ADMIN, STAFF, PATIENT, and anonymous tokens and asserts 200/403/401 as specified in `docs/rbac.md`.

### 3.4 Web auth
- [ ] Auth context storing in-memory access token + silent refresh on 401 (single-flight)
- [ ] `ProtectedRoute` / `RoleRoute` wrappers; redirect + return-path support
- [ ] `/login` (admin) and `/start` (patient entry: name + mobile, one screen, big buttons)
- [ ] Logout clears tokens, query cache, and socket connection

**Done when:** refreshing the page keeps the session; a patient visiting `/admin/doctors` is redirected with a toast; logout leaves no tokens in storage.

---

## 7. Phase 4 â€” Hospital management

**Goal:** admins can run the hospital's structure from the dashboard; patients see live doctor availability.

### 4.1 Departments
- [x] `POST/GET/PATCH/DELETE /api/v1/departments` (+ `?includeInactive`)
- [x] Soft delete via `isActive`; block delete when active appointments exist (409 with reason)
- [x] Admin page `Departments.tsx`: table, create/edit dialog, activate toggle, search
- [x] Public `GET /api/v1/departments?active=true` for booking flow (consumed by patient booking)

**Done when:** API/UI CRUD wired; active-appointment guard enforced (end-to-end manual verification pending).

### 4.2 Doctors
- [x] `POST/GET/PATCH/DELETE /api/v1/doctors` with department filter, search, pagination
- [x] Room assignment (`roomId`) validated unique (409 on conflict)
- [x] Admin page `Doctors.tsx`: table with department badge, avg consult minutes, room, active toggle, create/edit dialog
- [x] Public `GET /api/v1/doctors?departmentId=&date=` enriched with `isOnDuty`, `queueLength`, `nextAvailableSlot` (patient booking consumes it)

**Done when:** duplicate-room conflict handled; inactive doctors hidden in active/public views (further booking UX polish pending).

### 4.3 Schedules
- [x] Weekly `DoctorSchedule` CRUD with overlap validation (same doctor/day)
- [x] `ScheduleException` upsert/list/delete for holidays/overrides
- [x] `GET /api/v1/doctors/:id/availability?date=` returns slots with `{ start, end, label, rangeLabel, isBooked, isPast }` + duty/exception info
- [x] Slot generator utility in `packages/shared` (pure, unit-tested)
- [x] Admin UI: schedule/exceptions management dialog with availability preview (basic custom-hours exception support; richer time-range editor can be expanded)

**Done when:** slot generation/overlap rules covered by shared logic/tests; availability reflects bookings/exceptions (manual verification pending).

### 4.4 Departments/doctors UX polish
- [x] Empty states, loading skeletons, and basic UX refinements in admin/booking flows (optimistic updates can be expanded later)
- [x] Field-level client validation via shared zod schemas in admin department/doctor forms (react-hook-form adoption deferred)

**Done when:** invalid admin forms show field-level errors without a network call; booking/admin flows have clear loading/empty states.

---

## 8. Phase 5 â€” Appointment booking

**Goal:** a patient can book by QR scan or remote, get a token, and see it in "My appointments".

### 5.1 Booking API
- [ ] `POST /api/v1/appointments` â€” body `{ doctorId, slotStart, source, patientId? }`
- [ ] Server-side re-validation: slot exists in schedule, not in the past, not already booked, doctor active, department active
- [ ] Race safety: unique constraint on `(doctorId, slotStart)` + retry-on-conflict â†’ 409 `SLOT_TAKEN`
- [ ] Token number assigned inside the same transaction (per doctor per day sequence, gap-free enough for a queue)
- [ ] `source=WALK_IN` allowed only for STAFF/ADMIN
- [ ] `GET /api/v1/appointments` (role-scoped list, filters: date, status, doctorId, patientId, pagination)
- [ ] `GET /api/v1/appointments/:id` (with doctor, department, queue position, ETA)
- [ ] `PATCH /api/v1/appointments/:id/cancel` â€” allowed until `CALLED`; frees slot + renumbers queue positions
- [ ] `PATCH /api/v1/appointments/:id/reschedule` â€” admin/staff, same rules as create
- [ ] Booking confirmation creates a `Notification` (BOOKING_CONFIRMED) and queues the 30-min reminder

**Done when:** two parallel requests for the same slot yield exactly one 201 and one 409; cancel restores slot availability; every booking has a unique token per doctor/day.

### 5.2 QR flow
- [ ] `GET /api/v1/qr/hospital` â†’ signed payload `{ v: 1, hid, ts, sig }` (HMAC with `QR_SIGNING_SECRET`) + rendered QR PNG/SVG
- [ ] Admin page `Settings.tsx` shows the printable QR poster (hospital name, "Scan to book", logo)
- [ ] Web route `/scan/:payload` validates signature server-side (`POST /api/v1/qr/verify`), then routes to `/book?token=...`
- [ ] Expired/tampered QR â†’ friendly error page with "Book remotely" fallback link

**Done when:** scanning with a phone (or opening the URL) lands on booking with the hospital context; editing one character in the payload is rejected.

### 5.3 Patient booking UI
- [ ] `/book` stepper: 1) Department â†’ 2) Doctor (cards: designation, avg time, queue length, next slot) â†’ 3) Date + slot grid â†’ 4) Confirm summary â†’ 5) Token screen
- [ ] Slot grid shows available/booked/past states and disables double-submit
- [ ] Post-booking screen: token number, doctor, department, room, estimated time, "Add to calendar" (ICS download), "View queue"
- [ ] `/appointments` list with status chips and cancel action (confirm dialog)
- [ ] Auth gate: if no patient session, `/book` shows the name+phone sheet inline, then continues the same flow (no lost selection)

**Done when:** a first-time visitor can go from QR scan to token screen in under 45 seconds on a phone viewport; back navigation never loses the flow state.

### 5.4 Admin appointment management
- [ ] Admin page `Appointments.tsx`: date picker (default today), doctor filter, status filter, search by token/name/phone
- [ ] Actions: cancel, reschedule, mark arrived (check-in), mark no-show
- [ ] `POST /api/v1/appointments/walk-in` convenience endpoint for STAFF (patient by name/phone, auto token)

**Done when:** staff can register a walk-in patient in â‰¤3 interactions and it appears immediately in the doctor's queue.

---

## 9. Phase 6 â€” Queue engine

**Goal:** a trustworthy, auditable queue per doctor with ETA, calling, delay handling and hardware hooks.

### 6.1 Queue core
- [ ] `QueueEntry` created when an appointment reaches its day and is checked in (or auto-created for BOOKED appointments on the day, per chosen policy â€” document it)
- [ ] `GET /api/v1/queue/:doctorId?date=` â†’ ordered entries + `currentPatient` + `stats`
- [ ] `PATCH /api/v1/queue/:id/call` â€” BOOKED/WAITING/DELAYED â†’ CALLED, sets `calledAt`, `graceDeadlineAt = now + GRACE_MINUTES`
- [ ] `PATCH /api/v1/queue/:id/start` â€” CALLED â†’ IN_CONSULTATION, opens `Consultation` (staff action; also reachable from hardware event)
- [ ] `PATCH /api/v1/queue/:id/complete` â€” IN_CONSULTATION â†’ COMPLETED, closes `Consultation`, sets `durationSeconds`, triggers ETA recalc for everyone behind
- [ ] `PATCH /api/v1/queue/:id/skip` â€” CALLED/DELAYED â†’ SKIPPED (or requeue-to-end policy, configurable `SKIP_POLICY=end|drop`)
- [ ] `PATCH /api/v1/queue/:id/arrive` â€” mark arrived / undo skip
- [ ] All mutations guarded by the shared state machine + wrapped in a transaction that also writes `AuditLog`
- [ ] `position` recomputation helper keeps 1..n contiguous within a doctor/day

**Done when:** calling a patient twice returns 409; completing a consultation moves the next entry into position 1; concurrency test (10 parallel `complete` calls) never leaves duplicate positions.

### 6.2 ETA engine
- [ ] `estimateWait(entry)` = sum of `avgConsultMinutes` for entries ahead, using a rolling average of the doctor's last 10 completed consultations (fallback to configured average, clamp 3â€“60 min)
- [ ] Recalculate on: call, start, complete, skip, cancel, new booking, delay
- [ ] Store `estimatedStartAt` on `QueueEntry`; expose `estimatedWaitMinutes` in API responses
- [ ] Pure function `packages/shared/src/eta.ts` with unit tests (empty queue, 1 ahead, all delayed, zero-variance, long-consult outlier)
- [ ] Queue stats: `{ waiting, called, inConsultation, completed, skipped, avgConsultMinutes, patientsAhead }`

**Done when:** unit tests cover 8+ scenarios; ETA changes are pushed over socket (Phase 7) and reflected in the patient UI without reload.

### 6.3 Grace period & delay handling
- [ ] BullMQ delayed job created on `call`: after `GRACE_MINUTES` (default 10, env-configurable) â†’ if still CALLED, mark DELAYED + notify
- [ ] After `DELAY_MINUTES` more (default 10) â†’ auto-SKIP (configurable `AUTO_SKIP_ENABLED`) + notify
- [ ] Staff override endpoints with reason text; overrides are audit-logged
- [ ] Patient self check-in ("I'm here") endpoint resets grace window once per appointment

**Done when:** with `GRACE_MINUTES=1` in test env, a called patient automatically becomes DELAYED then SKIPPED, with notifications and audit rows, without any manual action.

### 6.4 Queue UIs
- [ ] Patient `QueueStatus.tsx`: big token card, "X patients ahead", ETA range, current token, live status timeline, "I'm here" button when within 2 positions, refresh-on-socket
- [ ] Admin `QueueManagement.tsx`: per-doctor columns (or doctor selector), drag-free ordered list, call/start/complete/skip/arrive buttons, elapsed timers, next-up highlight, manual reorder with audit
- [ ] Admin dashboard cards: total waiting, avg wait today, longest wait, consultations in progress
- [ ] Doctor "room view" screen (`/admin/room/:doctorId`) â€” full-screen current token, sized for a wall display

**Done when:** the queue screen updates within 1s of any action, and the room view is readable from 3 meters.

---

## 10. Phase 7 â€” Real-time & notifications

**Goal:** the right person gets the right nudge at the right moment, exactly once.

### 7.1 Socket.IO
- [ ] JWT auth handshake (`auth.token`), join rooms: `patient:{patientId}`, `doctor:{doctorId}`, `admin:queue`
- [ ] Events: `queue:updated`, `queue:called`, `appointment:updated`, `notification:new`, `swap:requested`, `swap:responded`, `hardware:occupancy`
- [ ] Emit from services, never from controllers (single emitter module `sockets/emitter.ts`)
- [ ] Client hook `useSocket` + query invalidation mapping (event â†’ invalidate keys) to avoid double-state bugs
- [ ] Reconnect strategy with `--with-credentials`, exponential backoff, fallback polling every 15s

**Done when:** two browsers (patient + admin) stay in sync through call â†’ start â†’ complete; killing the API brings the client back automatically.

### 7.2 Notification service
- [ ] `notify({ userId|patientId, type, channel, title, body, data, dedupeKey, scheduledFor? })` â€” single entrypoint
- [ ] Channel adapters behind `NotificationChannel` interface: `inApp` (DB + socket), `webPush` (FCM), `sms` (stub), `email` (stub)
- [ ] `IN_APP` fully working; `WEB_PUSH` wired with a service worker + permission prompt (deferred gracefully if denied)
- [ ] Dedupe via unique `dedupeKey` so retries never double-send
- [ ] Notification bell + list page per role; unread badge; mark-as-read

**Done when:** each event in the table below produces exactly one row and one socket event in tests.

| Trigger | Type | Timing |
|---|---|---|
| Booking created | `BOOKING_CONFIRMED` | immediate |
| Estimated turn âˆ’30 min | `READY_30_MIN` | scheduled job, rescheduled if ETA shifts |
| 2 patients ahead | `NEXT_IN_QUEUE` | on queue change |
| Called | in-app + push | immediate |
| Grace expired | `DELAY_WARNING` | after grace |
| Auto-skipped | `SKIPPED` | after delay |
| ETA changed >5 min | `QUEUE_UPDATED` | throttled to 1/10 min |
| Swap lifecycle | `SWAP_*` | immediate |
| Cancelled by hospital | `APPOINTMENT_CANCELLED` | immediate |

### 7.3 Scheduled jobs (BullMQ)
- [ ] Queue `notifications` + repeatable/precise delayed jobs; workers started in `server.ts` (separate `worker.ts` entrypoint optional)
- [ ] `READY_30_MIN` job keyed `ready30:{appointmentId}`; **cancel + reschedule** when ETA is recalculated (this is the tricky part â€” test it)
- [ ] Nightly job: seed tomorrow's queue entries from schedules, purge expired swap requests, close stale consultations
- [ ] Job failure handling: 3 retries with backoff, dead-letter logging, `GET /api/v1/admin/jobs` (read-only) for ops visibility
- [ ] Clock-skew guard: never schedule in the past; log skipped jobs

**Done when:** moving a doctor's average consultation time changes queued `READY_30_MIN` fire times; a Redis flush mid-run loses no notification state (rebuilt from DB on boot).

### 7.4 Preferences
- [ ] `NotificationPreference` per patient (in-app always on; push opt-in; SMS off by default)
- [ ] Quiet hours not needed for v1 â€” documented as future scope

**Done when:** disabling push stops pushes but not in-app rows.

---

## 11. Phase 8 â€” Appointment swap

**Goal:** two patients can trade slots safely; the queue stays consistent; neither side can be tricked.

### 8.1 Rules (write these into `docs/swap.md` before coding)
- [ ] Same doctor only (v1); same date; both appointments in `BOOKED`/`WAITING`/`NOTIFIED`
- [ ] Neither appointment `CALLED`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`
- [ ] One `PENDING` swap per appointment at a time; request expires in 10 minutes
- [ ] Both patients must consent, recorded as two distinct steps: (1) requester sends the request = requester consent, (2) target responds `ACCEPT`. Without step 2 the swap never executes â€” this is the "both must accept" rule, implemented as sequential consent rather than two simultaneous signatures
- [ ] Swaps allowed only until `SWAP_CUTOFF_MINUTES` (default 60) before the earlier slot

**Done when:** the doc's rule table has a matching test id for each rule.

### 8.2 API
- [ ] `POST /api/v1/swaps` `{ targetAppointmentId, message? }` â€” validates all rules, notifies target
- [ ] `GET /api/v1/swaps?role=incoming|outgoing` â€” patient's pending/history
- [ ] `POST /api/v1/swaps/eligible` â€” returns same-doctor appointments the patient may propose to (masked as token + slot + initials only, no PII leak)
- [ ] `PATCH /api/v1/swaps/:id/respond` `{ action: ACCEPT | REJECT }`
- [ ] `PATCH /api/v1/swaps/:id/cancel` (requester)
- [ ] Swap execution inside **one `prisma.$transaction`** with `SELECT ... FOR UPDATE` on both appointments + queue entries: exchange `slotStart/slotEnd/tokenNumber`, swap queue `position`, append `AuditLog`, set status `ACCEPTED`, notify both
- [ ] Expiry job â†’ `EXPIRED` + notify both
- [ ] Race test: two swaps targeting the same appointment, and accept/reject arriving simultaneously

**Done when:** a concurrency test (accept + cancel racing) ends in exactly one terminal state, no duplicate tokens/positions, and both patients see consistent data.

### 8.3 UI
- [ ] Patient `SwapRequests.tsx`: incoming (accept/reject with countdown), outgoing (pending with cancel), history
- [ ] From `MyAppointments`: "Swap slot" â†’ eligible list â†’ confirm dialog showing both slots clearly
- [ ] Admin `Swaps.tsx`: oversight table, cancel abusive requests, audit trail link
- [ ] Toasts + socket-driven updates (no polling)

**Done when:** two logged-in patients in side-by-side browsers complete a swap in under 20 seconds of wall-clock time, and both queues re-render correctly.

---

## 12. Phase 9 â€” Hardware integration (NXP FRDM-MCXN236)

**Goal:** room occupancy events flow securely into the backend and assist (never dictate) queue state.

### 9.1 Contract first (no hardware needed)
- [ ] `docs/hardware/contract.md`: MQTT topics, payloads, auth, retry, dedupe, failure modes
  - `waitless/rooms/{roomId}/occupancy` â†’ `{ v:1, roomId, type:"OCCUPIED"|"VACANT", ts, seq, sig }`
  - `waitless/rooms/{roomId}/heartbeat` â†’ `{ v:1, ts, rssi, fw }`
- [ ] Device auth: per-device token in CONNECT username/password (Mosquitto ACL file) + HMAC body signature with `DEVICE_HMAC_SECRET`
- [ ] `POST /api/v1/hardware/events` HTTP fallback with identical schema
- [ ] Idempotency: `dedupeKey = roomId:seq`, unique index; replays are ignored
- [ ] Gateway module `integrations/mqtt.ts`: subscribe, verify, persist `HardwareEvent`, enqueue processing

**Done when:** `hardware/simulator/publish.ts` can emit OCCUPIED/VACANT and rows land in `HardwareEvent` with `processedAt` set and correct linkage.

### 9.2 Association logic (the important engineering detail)
- [ ] Occupancy **cannot** identify a patient â†’ associate with the doctor's `IN_CONSULTATION` appointment whose room matches
- [ ] `OCCUPIED` when nothing in consultation â†’ create an "unscheduled occupancy" alert for staff (never auto-create a consultation)
- [ ] `VACANT` while `IN_CONSULTATION` â†’ set `suggestedEndAt` + staff prompt "Consultation finished?"; auto-complete only if `HARDWARE_AUTO_COMPLETE=true` **and** vacancy persists `AUTO_COMPLETE_DEBOUNCE_MINUTES` (default 2)
- [ ] Debounce/flicker guard: ignore state flips within `SENSOR_DEBOUNCE_SECONDS` (default 5)
- [ ] Staff override always wins; log `endedSource=SENSOR|STAFF`
- [ ] Stale-device watchdog: no heartbeat for 5 min â†’ mark room `DEGRADED`, show badge in admin UI

**Done when:** scripted scenarios (patient walks in/out, patient leaves without staff action, device dies) each produce the expected queue state + alert, verified by integration tests using the simulator.

### 9.3 Firmware & simulator
- [ ] `hardware/firmware/README.md`: board bring-up, toolchain (MCUXpresso / Zephyr), sensor choice, pinout, Wi-Fi module note (FRDM-MCXN236 has no radio â†’ document ESP32/CYW43439 add-on and the UART/SPI link)
- [ ] Minimal firmware skeleton: sensor read â†’ debounce â†’ MQTT publish â†’ heartbeat task (target: publish working in a lab)
- [ ] `hardware/simulator/` CLI: `pnpm simulate --room OPD-1 --pattern in-out` supporting manual mode + scripted scenarios
- [ ] `hardware/docs/wiring.md` with photo/diagram placeholders and calibration notes

**Done when:** the simulator can convincingly drive a full consultation lifecycle on stage, and the firmware skeleton compiles and publishes heartbeat.

### 9.4 Admin hardware view
- [ ] Admin `Settings.tsx` â†’ Rooms: assign `roomId` to doctors, show live occupancy state, last heartbeat, event log (last 20), "Simulate event" button for demos

**Done when:** the room tile flips color within 2s of a simulator event.

---

## 13. Phase 10 â€” Analytics, hardening, demo polish

### 10.1 Analytics
- [ ] `GET /api/v1/analytics/overview?from=&to=` â†’ appointments, completed, cancelled, no-show rate, avg wait, avg consult, peak hours
- [ ] `GET /api/v1/analytics/doctors` â†’ per-doctor throughput, avg consult, skip rate
- [ ] Admin `Dashboard.tsx`: KPI cards, simple charts (Recharts), date range, "today" default
- [ ] Export CSV for appointments (staff)

**Done when:** numbers reconcile with raw DB counts (test asserts parity for a seeded day).

### 10.2 Hardening
- [ ] `helmet`, strict CORS allowlist, rate limits per route class, body size limits
- [ ] Validate every input with shared zod schemas; no `any` in API boundary
- [ ] Prisma query logging in dev only; slow-query log >200ms
- [ ] Structured audit log for every state mutation; `GET /api/v1/admin/audit`
- [ ] Error taxonomy documented (`docs/errors.md`) with stable `code` strings
- [ ] Secrets: `.env` never committed; `env.ts` validated with zod at boot (fail fast)
- [ ] Backup/restore note in `docs/runbook.md`

**Done when:** `pnpm audit` has no high/critical; booting with a missing env var fails with a clear message; the OWASP top-10 checklist in `docs/security.md` is filled in.

### 10.3 Testing & CI
- [ ] Unit: slot generator, ETA, state machine, swap transaction, phone normalization
- [ ] Integration: supertest suites per module against a disposable Postgres (docker, `testcontainers` or a `waitless_test` DB reset per run)
- [ ] E2E smoke (Playwright): patient books â†’ admin calls â†’ completes â†’ patient sees COMPLETED; swap happy path; QR entry
- [ ] CI runs lint + typecheck + unit + integration on every PR; E2E on `main`
- [ ] Coverage target: services â‰¥70% lines (report, don't block initially)

**Done when:** `pnpm test` from a clean clone passes with Docker running; CI time under 10 minutes.

### 10.4 Demo readiness
- [ ] Seed script `db:seed:demo` produces a hospital mid-flow (queue with 6 waiting, 1 in consultation, 1 delayed)
- [ ] Landing page explaining Waitless + "Hospital staff login" / "Book as patient"
- [ ] Empty/error/loading states reviewed on every page (checklist in PR template)
- [ ] Mobile responsive audit (375px, 768px, 1440px) for all patient pages
- [ ] README screenshots + 60-second demo script in `docs/demo.md`
- [ ] Accessibility pass: labels, focus rings, contrast, keyboard-only booking

**Done when:** a stranger can run the README and complete the demo script unaided.

---

## 14. Phase 11 â€” Future scope (explicitly out of v1)

- [ ] Separate doctor login + doctor-facing console
- [ ] OTP/SMS verification (`PatientAuthProvider` â†’ `sms-otp`)
- [ ] RAG chatbot (pgvector + LLM, guardrailed to hospital data; read-only tools)
- [ ] Multi-hospital tenancy (`hospitalId` scoping + migrations)
- [ ] Payments / prepaid consultations
- [ ] WhatsApp notifications
- [ ] Offline/PWA mode for poor connectivity
- [ ] Predictive ETA using historical ML
- [ ] Hardware: multi-sensor room presence (entry + chair), RFID patient detection

---

## 15. Cross-cutting conventions

**API**
- Base `/api/v1`; resource nouns; verbs only for actions (`/call`, `/complete`, `/cancel`, `/respond`)
- Response shapes: single resource = object; lists = `{ data: T[], meta: { page, pageSize, total } }`
- Errors: `{ error: { code, message, details? } }`; codes are stable strings (`SLOT_TAKEN`, `INVALID_TRANSITION`, `GRACE_EXPIRED`)
- All timestamps ISO-8601 UTC in API, rendered in `Asia/Kolkata` on the client; store UTC only
- Idempotency-Key header respected on `POST /appointments`, `POST /swaps`

**Status transitions (authoritative)**

```
BOOKED â”€â”€checkinâ”€â”€â–¶ WAITING â”€â”€callâ”€â”€â–¶ CALLED â”€â”€startâ”€â”€â–¶ IN_CONSULTATION â”€â”€completeâ”€â”€â–¶ COMPLETED
  â”‚                   â”‚                â”‚  â”‚                  â”‚
  â”‚                   â”‚                â”‚  â””â”€grace expiredâ”€â–¶ DELAYED â”€â”€arriveâ”€â”€â–¶ CALLED
  â”‚                   â”‚                â””â”€â”€â”€â”€â”€â”€skipâ”€â”€â”€â”€â”€â”€â”€â”€â–¶ SKIPPED â”€â”€arriveâ”€â”€â–¶ CALLED
  â””â”€â”€â”€â”€cancelâ”€â”€â”€â”€â”€â”€â”€â”€â–¶ CANCELLED   (cancel allowed from BOOKED, WAITING, NOTIFIED, DELAYED)
NOTIFIED is WAITING + alert sent (UI-only distinction; still queueable)
NO_SHOW is terminal, set by staff or auto after day end
```
- `NOTIFIED` must not be a dead-end: `NOTIFIED â†’ CALLED`, `NOTIFIED â†’ DELAYED`, `NOTIFIED â†’ SKIPPED`, `NOTIFIED â†’ CANCELLED`
- Frontend never sets status; it only requests actions

**Time handling**
- Server authority for "now"; client clocks untrusted
- Doctor schedules stored as minutes-from-midnight + `dayOfWeek`; slot generation in a pure function taking a timezone

**Testing pyramid**
- Pure functions (shared) â†’ unit, fast, no DB
- Services â†’ integration with real Postgres, no mocks of Prisma
- HTTP â†’ supertest per module
- Flows â†’ Playwright

**Git**
- `main` protected; feature branches `feat/queue-engine`, `fix/eta-drift`
- Conventional commits; PR template with "What / Why / How tested / Screenshots"
- One PR per task group; no PR > ~600 changed lines when avoidable

---

## 16. Environment variables (`.env.example` checklist)

```
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:5173
API_BASE_URL=http://localhost:4000/api/v1

DATABASE_URL=postgresql://waitless:waitless@localhost:5432/waitless?schema=public
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=change-me
JWT_REFRESH_SECRET=change-me
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
QR_SIGNING_SECRET=change-me

SEED_ADMIN_EMAIL=admin@waitless.local
SEED_ADMIN_PASSWORD=Admin@12345

GRACE_MINUTES=10
DELAY_MINUTES=10
AUTO_SKIP_ENABLED=true
SKIP_POLICY=end
SWAP_CUTOFF_MINUTES=60
SWAP_EXPIRY_MINUTES=10
READY_ALERT_MINUTES=30
HOSPITAL_TIMEZONE=Asia/Kolkata
DEFAULT_CONSULT_MINUTES=12

MQTT_URL=mqtt://localhost:1883
MQTT_USERNAME=waitless-gateway
MQTT_PASSWORD=change-me
DEVICE_HMAC_SECRET=change-me
HARDWARE_AUTO_COMPLETE=false
AUTO_COMPLETE_DEBOUNCE_MINUTES=2
SENSOR_DEBOUNCE_SECONDS=5

FCM_PROJECT_ID=
FCM_CLIENT_EMAIL=
FCM_PRIVATE_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

SMS_PROVIDER=mock
```

- [ ] All of the above validated in `config/env.ts` with zod; app refuses to boot on error

---

## 17. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| ETA drift after delays/skips | Patients lose trust | Recalc on every mutation; rolling average; show ETA as a range ("~20â€“30 min") |
| `READY_30_MIN` firing after the turn already came | Spam | Job cancel/reschedule on ETA change; dedupeKey; guard "only if status in WAITING/NOTIFIED" |
| Swap double-spend (two patients claim one slot) | Corrupt queue | Row-level locks + single transaction + unique `(doctorId, slotStart)` + concurrency tests |
| Hardware produces noise (door ajar, cleaning staff) | False completions | Debounce, `HARDWARE_AUTO_COMPLETE=false` default, staff confirmation, event log |
| NXP board has no network radio | Phase 9 blocker | Document ESP32/CYW add-on early (9.3) + simulator keeps demo on track |
| Patient identity without OTP â†’ impersonation | Privacy | v1 accepts it (explicit decision); hide PII in swap lists; OTP path pre-wired |
| pnpm/Turborepo learning curve | Slow start | Phase 1 keeps scaffolds empty; `docs/dev-setup.md` with copy-paste commands |
| Scope creep into chatbot/doctors login | Slipped deadline | Section 14 is explicitly out of v1 |

---

## 18. Phase exit criteria (gate checklist)

A phase is `[x]` only when **all** of these are true:
- [ ] Every task checkbox in the phase is ticked
- [ ] Each "Done when" statement verified manually and/or by an automated test
- [ ] No `TODO`/`FIXME` left in the phase's code without a linked issue note
- [ ] `pnpm lint && pnpm typecheck && pnpm test` green
- [ ] Docs updated (`docs/api.md` for new endpoints, ADR for new decisions)
- [ ] Status board + change log updated

---

## 19. Change log

| Date | Phase | Note |
|---|---|---|
| 2026-11-13 | â€” | Plan created. Decisions: pnpm+Turborepo; OTP deferred (name+mobile session); single hospital. |
| 2026-11-13 | 1 | Foundation complete: monorepo scaffold, Docker infra (postgres/redis/mosquitto), API skeleton (Express + Prisma/Redis + health/readiness + Socket.IO), web skeleton (Vite/React/Tailwind v4/shadcn-style UI, all public/patient/admin routes), shared package, CI, ADR/db/state-machine docs. Root quality gates green (`pnpm lint`, `typecheck`, `test`, `build`) and `pnpm db:ping` returns db+redis up. |
| 2026-11-13 | 2 | Database/domain complete: Prisma 6 schema + migrations (incl. pending-swap partial unique indexes), idempotent seed with demo clinic data, enum drift test, shared state machine/time/slot logic with tests. |
| 2026-11-13 | 3 | Auth/RBAC baseline implemented: staff login/refresh/logout/me, patient mock name+mobile session, guards/middleware, web auth context + route guards + wired login/start/logout, RBAC matrix doc. Committed and pushed incrementally. |
| 2026-11-13 | 4 | Hospital management complete (practical): department/doctor/schedule+availability APIs, admin management UIs, patient booking wired to live data/slots (submission pending Phase 5), shared-schema client validation and loading/empty-state polish. Committed and pushed incrementally. |
| 2026-11-13 | 5 | Appointment booking in progress: core booking/walk-in/list/get/cancel/reschedule APIs with slot validation, conflict handling and per-day tokens; patient booking submission+token screen and My Visits; admin appointments list/filters/walk-in/cancel basics. QR flow and queue-integrated behaviors pending. |
