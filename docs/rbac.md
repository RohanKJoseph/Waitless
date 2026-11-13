# RBAC matrix (Phase 3 baseline)

Roles: `ADMIN`, `STAFF`, `PATIENT`, and anonymous (no token).

| Area / endpoint | Anonymous | PATIENT | STAFF | ADMIN | Notes |
|---|---:|---:|---:|---:|---|
| `GET /api/v1/health`, `/health/ready` | 200 | 200 | 200 | 200 | Public liveness/readiness |
| `POST /api/v1/auth/login` | 200/401/429 | — | — | — | Staff login (ADMIN/STAFF accounts only) |
| `POST /api/v1/auth/refresh` | 200/401 | 200 | 200 | 200 | Uses httpOnly refresh cookie; rotates token |
| `POST /api/v1/auth/logout` | 204 | 204 | 204 | 204 | Clears/revokes refresh session (best effort) |
| `GET /api/v1/auth/me` | 401 | 200 | 200 | 200 | Current authenticated user |
| `POST /api/v1/patients/session` | 201/422/429 | 201 | 201 | 201 | Mock name+mobile sign-in (no OTP), returns access token + profile |
| `GET /api/v1/patients/me` | 401 | 200 | 403 | 403 | Patient-only profile endpoint |
| `PATCH /api/v1/patients/me` | 401 | 200 | 403 | 403 | Patient can update name/email only (no phone change) |
| Future `:patientId` resources | 401 | 200 own / 403 others | 200 (staff ops) | 200 | Enforce via `authenticate` + role/ownership guards |
| Future admin/hospital mgmt routes | 401 | 403 | 200/403 by matrix | 200 | Staff permissions refined per module in later phases |

## Guards (API)
- `authenticate`: verifies bearer access token and attaches `req.auth = { userId, role, patientId? }`.
- `authorize(...roles)`: role gate (401 if unauthenticated, 403 if role not allowed).
- `requireSelf(param)` / ownership checks: patients may only access own records; admin/staff may access operationally as specified.

## Notes
- Patient identity is mock/unverified in Phase 3 (`phoneVerified=false`) behind `PatientAuthProvider`; OTP flow is a stubbed upgrade path.
- Web route guards mirror this matrix (`/patient/**` requires PATIENT, `/admin/**` requires ADMIN/STAFF) and redirect with a toast on forbidden navigation.
- Full table-driven route authorization tests (all endpoints × roles) should be added as modules land.