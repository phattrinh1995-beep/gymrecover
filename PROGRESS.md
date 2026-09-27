# GymRecover — Build Progress

Tracking milestones from the build order. Each milestone is summarized here with what was built, what's stubbed, and assumptions made, per the project instructions.

## Environment notes
- Node.js was not pre-installed; installed Node LTS v24.19.0 via winget (user-approved).
- PowerShell tool calls do not persist environment/PATH between calls, so every command in this session re-derives PATH from the machine/user environment variables.

## Milestone 1: Data model & migrations — DONE

**Stack decisions made (per "pick one" instructions):**
- Auth: **Auth0** chosen over Clerk — its Organizations feature maps directly onto the `Organization` (gym/clinic) + `ProviderAssignment` model, which fits the multi-tenant provider/patient structure better than Clerk's org model. Not yet integrated (that's milestone 3+); `AUTH0_DOMAIN`/`AUTH0_AUDIENCE` placeholders are in `backend/.env`, and `User.authSubjectId` stores the Auth0 `sub` claim (no passwords are ever stored).
- ORM/migrations: **Prisma 6.19** (pinned — avoided the `prisma@8.0.0-rc` pre-release that npm resolved by default, since it changes `prisma init`/client-generation behavior and isn't stable).
- Local dev database: **`npx prisma dev`** (Prisma's local Postgres-in-a-process) instead of installing a system PostgreSQL service or Docker — neither was present on this machine, and this avoids adding a persistent Windows service/open port for a dev-only need. `backend/.env`'s `DATABASE_URL` points at it. Swap it for a real managed Postgres connection string in staging/prod.
- Environment: Node.js wasn't installed on this machine; installed Node LTS v24.19.0 via `winget` with your approval.

**What was built** (`backend/`, NestJS + TypeScript, ESM/NodeNext):
- `prisma/schema.prisma` — full data model for all 13 required entities (`User`, `Profile`, `InjuryProfile`, `ProtocolTemplate`, `Phase`, `Exercise`, `PhaseExercise`, `ProgramInstance`, `SessionLog`, `OutcomeAssessment`, `ProviderAssignment`, `Organization`, `Subscription`), plus a supporting `AuditLog` entity (see below).
- First migration applied and Prisma Client generated (`prisma/migrations/20260924023925_init`).
- `src/prisma/` — `PrismaService`/`PrismaModule` (global, injectable DB client).
- `src/common/encryption/` — `EncryptionService` (AES-256-GCM field-level encryption) with unit tests, for encrypting sensitive free-text health fields (`InjuryProfile.diagnosisText`, `OutcomeAssessment.rawAnswers`) before they're written by Prisma. **Not yet wired into any service** — that lands with the InjuryProfile/OutcomeAssessment services in milestones 3/7. The dev key in `.env` is a placeholder; production needs a real KMS-issued/rotated key.
- Verified: `npm run build` compiles clean, `npm test` passes (6/6 tests), and the app boots and connects to Postgres (`npm run start` / `node dist/main.js`).

**Design choices / assumptions (flagged, not hard clinical facts):**
- `InjuryProfile.currentPhaseId` is kept as a denormalized pointer (per the spec's exact field list) that the Adaptive Program Engine will sync whenever `ProgramInstance.currentPhaseId` changes — the operational source of truth is `ProgramInstance`, since a user's injury profile can outlive any one protocol run.
- Added `ProgramInstance.manualHold` (boolean + reason) as the *actual* provider-hold switch a provider flips in the portal (milestone 8), separate from the `provider_hold` flag that lives inside a `Phase`'s `exitCriteria` JSON (which is a per-phase-template rule, e.g. "this phase always requires clinician sign-off").
- Added `AuditLog` (actor, target, action, metadata, timestamp) even though it wasn't in the explicit entity list, because the non-functional requirements explicitly mandate "audit logging for provider access to patient data" — there's nowhere else to put that.
- `SessionLog.exerciseResults` is stored as JSON (array of per-exercise results) rather than a separate join table, to stay within the listed entities rather than inventing a 14th table; can be normalized later if querying per-exercise history becomes a real need.
- `ProtocolTemplate.reviewedBy` defaults to `"PLACEHOLDER - requires licensed clinical review"` and `sourceCitation` is nullable — enforced at the schema level, not just convention.
- No real content seeded yet — that's milestone 2.

**Not done yet (by design, per build order):** seed content (milestone 2), Auth0 wiring, onboarding flow, red-flag gate, the Adaptive Program Engine, session UI, outcome tracking, provider portal, performance track, org/admin invite flows, S3 media upload, and notifications. `.env` has placeholder S3 and Auth0 config so those milestones don't need to re-derive config shape.

**Review pass (before milestone 2):** re-read the full schema, encryption service, and module wiring. Found and fixed two real issues:
- `OutcomeAssessment.rawAnswers` was typed `Json` but always holds AES-GCM ciphertext (a string) — inconsistent with the file's own stated convention and misleading for anyone tempted to run Postgres JSON operators against it. Changed to `String`.
- `ProviderAssignment` had a hard `@@unique([providerId, patientId])`, which would reject re-assigning the same provider to the same patient after an earlier assignment was ended (`active: false`) — a real lifecycle gap for milestone 8. Relaxed to a plain index; "one active assignment per pair" will be enforced in the service layer instead.
- Rebuilt the migration history clean (single `init` migration reflecting the fixed schema, since nothing had shipped anywhere yet) and re-verified: build, 6/6 unit tests, and app boot all pass.
- Also hit and worked around instability in Prisma's local dev Postgres (`npx prisma dev`) — a stale shadow-database conflict after restarting the sandbox — by wiping and recreating that local instance. Purely a local dev-tooling hiccup, not a schema issue; noting it in case it recurs.

Proceeding to **Milestone 2: seed content (ACL reconstruction + rotator cuff protocol templates)**.

## Milestone 2: Seed content — DONE

**What was built:**
- [`prisma/seed.ts`](backend/prisma/seed.ts) — idempotent seed script (upsert-based, safe to re-run) loading two full protocol templates:
  - **ACL Reconstruction (knee)** — 4 phases (Protection & Early Motion → Early Strength & ROM → Progressive Strengthening → Return to Activity), 6-7 exercises per phase.
  - **Rotator Cuff Repair (shoulder)** — 4 phases (Immobilization & Passive ROM → Active-Assisted ROM & Early Strengthening → Progressive Strengthening → Return to Function/Sport), 6 exercises per phase.
  - 49 exercises total across both, each with sets/reps/hold-time prescriptions on `PhaseExercise`.
  - Every `ProtocolTemplate.reviewedBy` is hard-set to `"PLACEHOLDER - requires licensed clinical review"`; `sourceCitation` is left `null` for real citations to be added later.
  - Every entry/exit criteria threshold (days-since-surgery, pain score caps, ROM degrees, hop-test symmetry index, etc.) is an invented placeholder for demoing the engine's rule shapes — **none of these are real clinical thresholds**. The final phase of each protocol sets `provider_hold: true` in its exit criteria, meaning this placeholder protocol always requires explicit clinician sign-off before "return to sport/activity," regardless of other criteria.
- `npm run seed` script wired up (also registered as the classic `package.json#prisma.seed` hook).
- Added `@unique` constraints on `ProtocolTemplate.name` and `Exercise.name` (needed for the seed's upsert-by-name idempotency) and applied them to the local dev database.

**Infra hiccups hit and resolved (both are local-sandbox quirks, not schema/app bugs):**
- The bundled `npx prisma dev` local Postgres doesn't reliably support the shadow database that `prisma migrate dev` needs for diffing — a second `migrate dev` call in the same sandbox session threw `type "Role" already exists` against the shadow DB. Worked around by using `prisma db push` for local schema sync and hand-authoring the equivalent SQL into `prisma/migrations/20260924031500_add_unique_names_for_seed/` (marked applied via `prisma migrate resolve --applied`) so migration history stays accurate for a real Postgres target. **Action item before staging/prod:** point `DATABASE_URL` at a real Postgres (managed or Dockerized) and confirm `prisma migrate deploy` applies the full history cleanly there — this hasn't been verified outside the local sandbox.
- The sandbox also proxies connections through something pgbouncer-like, which caused `prepared statement "s0" already exists` errors on the second Prisma query in a session. Fixed by adding `pgbouncer=true` to `DATABASE_URL` (disables Prisma's prepared-statement caching) — documented inline in `.env`.

**Verified:** build clean, 6/6 unit tests pass, seed runs and is idempotent (re-running upserts the same rows rather than duplicating), and a verification query confirmed the full phase/exercise counts and placeholder markers.

**Not done / explicitly out of scope for this milestone:** no exercise demo media (video/image URLs are `null` — that's milestone 6/S3 wiring), no admin CMS to edit this content yet (milestone per non-functional requirements, likely bundled with provider portal work), and the criteria thresholds are illustrative only and must be replaced under real clinical review before any real user sees them.

Proceeding to **Milestone 3: Onboarding & Intake flow (mobile app)** — this is the first mobile-app milestone, so it'll start with scaffolding the React Native project.

## Milestone 3: Onboarding & Intake flow — DONE

**Mobile stack decision:** used **Expo** (React Native + TypeScript, satisfies the spec's stack choice) instead of bare React Native CLI, because this machine has no Android Studio/Xcode and Expo's web target let me actually run and click through the flow in-browser to verify it, rather than just eyeballing code. The project's own `mobile/AGENTS.md` (pre-existing in this workspace) specifies **Expo Router** file-based routing — I initially built the flow with React Navigation directly, then caught that instruction on re-reading and restructured everything into `mobile/src/app/` route files before finishing, per that guidance.

**What was built:**
- `mobile/` — Expo SDK 57 + TypeScript app, Expo Router, `expo-doctor` 21/21 checks pass, `tsc --noEmit` clean.
  - Screens (`src/app/`): `index` (Welcome) → `sign-up` → `goals` (activity level + goals text) → `injury-intake` (branching: recovering vs. healthy) → if injury: `diagnosis` (region/side/free-text) → `surgery` (Y/N, type, date) → if surgery: `clearance` (the required gate) → `summary` (review + submit) → `home` (placeholder landing).
  - `src/auth/AuthContext.tsx` + `src/onboarding/OnboardingContext.tsx` carry state across the branching screens; `src/api/client.ts` is the backend fetch wrapper; `src/components/Disclaimer.tsx` renders the non-dismissible disclaimer text (used on the clearance screen and home).
- `backend/src/auth/` — `JwtStrategy` (real Auth0 JWKS/RS256 verification, ready for a real tenant), `JwtAuthGuard`, `CurrentUser` decorator.
- `backend/src/users/` — JIT user provisioning (`GET /users/me` creates the `User` row from the token on first call — there's no separate signup endpoint, matching how Auth0-backed apps normally work), `PATCH /users/me/profile` for the goals/activity-level questionnaire.
- `backend/src/injury-profiles/` — `POST /injury-profiles` (creates the branching intake's `InjuryProfile`, encrypting `diagnosisText` via the milestone-1 `EncryptionService` — verified round-trip against real Postgres, see below), `GET /injury-profiles`.
- Clearance gate logic (`requiresClearanceConfirmation` in `users.service.ts`, unit-tested): true whenever a user has a surgical injury profile whose `clearanceStatus` is still `PENDING`. The mobile `home` screen reads this flag and hides all recovery-content messaging (and shows the disclaimer instead) until it's false — this is the actual enforcement point for build order item 3's "no recovery content before clearance is answered" requirement, since no `ProgramInstance`/`Phase` content exists to show yet anyway (that's milestone 5).

**Verified live, not just unit-tested:** ran both the NestJS backend and the Expo web build in the browser pane, and clicked through the full ACL-style path (sign-up → moderate activity → "recovering from injury" → knee/right/ACL tear → surgery yes/ACL reconstruction/2026-06-15 → clearance "No, or I am not sure" → summary → finish). Confirmed in Postgres afterward that the `User`, `Profile`, and `InjuryProfile` rows were created correctly, `diagnosisText` was stored as ciphertext (not plaintext), and the Home screen correctly showed the disclaimer and blocked recovery messaging because `clearanceStatus: "PENDING"`. Also verified logout clears the session and returns to Welcome.

**Deliberate placeholder — needs your input before this is real:** there is no real Auth0 tenant connected (would need Auth0 dashboard access this build doesn't have). Both sides fake it in a way that's structurally ready for the real thing but cannot be mistaken for it:
- Backend: `JwtAuthGuard` has a `AUTH_DEV_BYPASS` mode that trusts `x-dev-user-sub`/`x-dev-user-email` headers instead of a verified token. It throws at startup if that flag is ever combined with `NODE_ENV=production`, so it can't ship silently enabled.
- Mobile: `AuthContext` does a fake local "login" (email + name, no password, no verification) and derives a stable fake `sub` from the email.
- **Action item:** once you have an Auth0 tenant, replace `AuthContext`'s dev login with `react-native-auth0` (or your chosen SDK), set `AUTH_DEV_BYPASS=false`, and fill in real `AUTH0_DOMAIN`/`AUTH0_AUDIENCE`. The backend `JwtStrategy` is already written against real Auth0 JWKS verification and shouldn't need changes.

**Other assumptions:**
- Surgery date is entered as free-text `YYYY-MM-DD` rather than a native date picker, to avoid pulling in a date-picker dependency for a milestone that's mainly about proving the data flow — worth swapping for a real picker component before this ships to users.
- The clearance question only appears when the user reports surgery (matching the spec's "if the user reports a recent surgery, require..." wording); a non-surgical injury (e.g. a muscle strain with no operation) skips straight to summary.

Proceeding to **Milestone 4: Red-flag triage gate**.

## Milestone 4: Red-flag triage gate — DONE

**What was built:**
- `backend/src/session-logs/red-flags.ts` — `isAnyRedFlagPresent()`, a pure function with no threshold or severity judgment: a single checked symptom blocks, full stop. Unit-tested exhaustively (each of the 6 symptoms individually, none checked, multiple checked) — 8 new tests.
- `backend/src/session-logs/` — `POST /session-logs/red-flag-check` accepts the 6 symptoms (severe/worsening pain, new/increasing swelling, fever, numbness/tingling, calf pain/swelling, chest pain/shortness of breath) plus an `injuryProfileId`. Always writes a `SessionLog` (whether or not triggered, so every gate run leaves a record), returns `{ allowed, sessionLogId, notifiedProviderIds }`.
- `backend/src/program-instances/` — a small bridge service (`ensureActiveRecoveryInstance`) that auto-enrolls a user in the first active seeded protocol template matching their injury's region if they don't already have one, purely so `SessionLog` has a `ProgramInstance` to attach to. **This is not the Adaptive Program Engine** (milestone 5) — it does no criteria evaluation and always starts at phase 1. It also re-enforces the milestone-3 clearance gate server-side (throws `ForbiddenException` if a surgical injury's clearance is still `PENDING`), so the red-flag gate can't be reached by going around the mobile UI.
- Provider notification: no real push/email delivery exists yet (Firebase Cloud Messaging / Postmark aren't configured — that needs real project credentials this build doesn't have). When triggered, the service looks up the patient's active `ProviderAssignment`s, logs a structured warning, and records `notifiedProviderIds` on the `SessionLog` itself as an auditable stand-in, rather than silently dropping the alert or fabricating a notification that didn't really send. **Action item:** wire real FCM/Postmark delivery here once credentials exist.
- Mobile (`mobile/src/app/red-flag-check.tsx`, `session-placeholder.tsx`): a checklist screen with all 6 symptoms. Checking any of them and submitting shows a full-screen "Please seek medical care" block with **only** a "Return to Home" action — there is no path back into the session from that state. Clearing the checklist proceeds to a placeholder screen (real session content is milestone 6). `home.tsx` now shows a "Start today's session" button once clearance is confirmed, which is the entry point into this gate.

**Verified live:** ran both servers in the browser pane and exercised both branches end to end — (1) a shoulder/rotator-cuff test user with self-reported clearance, clean checklist → passed through to the session placeholder; (2) the same user checking "chest pain or shortness of breath" → blocked with the seek-care message and no dismiss option. Confirmed in Postgres that both attempts wrote `SessionLog` rows (`redFlagTriggered: false` and `true` respectively, with the exact symptom booleans), sharing one auto-provisioned `ProgramInstance` correctly matched to the Rotator Cuff Repair protocol template by region. Confirmed the structured warning log fired for the triggered case.

**Assumptions / scope notes:**
- No severity weighting or "call 911 vs. call your PT" branching — every symptom is treated as an unconditional stop, per the spec's "no dismiss-and-continue path." A real clinical reviewer may want to differentiate urgency (e.g., chest pain → emergency messaging vs. mild swelling → contact provider) — flagged for clinical review, not decided here.
- The "before every recovery-track session" requirement is satisfied structurally (the gate sits in front of the one session entry point that exists); once milestone 6 builds real daily session content, that flow must route through this same gate rather than bypassing it.

Proceeding to **Milestone 5: Adaptive Program Engine (backend service)**.

## Milestone 5: Adaptive Program Engine — DONE

This is the core differentiator, so it got the most deliberate design of any milestone so far: two pure, zero-dependency modules carry all the actual decision logic, with everything DB-related kept to a thin orchestration layer around them.

**What was built** (`backend/src/program-engine/`):
- `criteria.ts` — `evaluatePhaseExitCriteria(exitCriteria, facts)`. A registry of one evaluator function per criteria key, each returning `{ met, reason }`. Implemented and fully tested: `min_days_since_surgery`, `max_pain_score` (worst of the last 3 logged scores must be at/below threshold — insufficient data is treated as **not met**, never assumed-passing), `no_swelling_increase_24h` (checked against real red-flag-check history from milestone 4), and `provider_hold` (an explicit "always needs a human" flag that blocks regardless of everything else — the seeded protocols use this on their final phase). **Any criteria key with no registered evaluator — e.g. `min_knee_flexion_rom_degrees`, `hop_test_limb_symmetry_index_percent`, `single_leg_stance_seconds` — is reported as NOT met with an explicit "no automated evaluator, needs clinical data collection" reason.** This is a deliberate, load-bearing decision: the app does not currently collect range-of-motion, symmetry-index, or stance-time data anywhere, so fabricating a pass for those criteria would be exactly the kind of invented clinical judgment the project brief prohibits. The honest, safe behavior is to block automated advancement and require manual provider review until real measurement collection exists.
- `advancement.ts` — `shouldApplyAdvancement(...)`, the second safety-critical rule: a phase change is **never automatic**, even when every criterion passes. It requires the patient's own acknowledgment, plus the assigned provider's acknowledgment if one exists, and a `manualHold` always overrides everything.
- `program-engine.service.ts` — orchestrates the above against real Prisma data: `checkEligibility` (computes facts from `InjuryProfile.surgeryDate` + recent `SessionLog.painScore`/red-flag history, records a `pendingPhaseId` prompt if newly eligible, **withdraws** a stale pending prompt if a later red flag makes the patient no longer eligible), `getStatus` (for the mobile prompt to read/poll), and `acknowledge` (derives the caller's role — patient vs. assigned provider — from who they actually are server-side, never from a client-supplied flag; only flips `currentPhaseId` once every required acknowledgment is in, inside a transaction that also syncs the milestone-1 denormalized `InjuryProfile.currentPhaseId`).
- Schema addition: `ProgramInstance` gained `pendingPhaseId`, `eligibleSince`, `userAcknowledgedAt`, `providerAcknowledgedAt` to carry the "awaiting acknowledgment" prompt state durably (so it survives app restarts and is visible to a future provider portal).
- Endpoints: `POST /program-engine/instances/:id/check-eligibility` (mobile calls this after each session), `GET /program-engine/instances/:id` (status), `POST /program-engine/instances/:id/acknowledge`.
- Mobile: `session-placeholder.tsx` now actually calls check-eligibility after the (placeholder) session and renders the full criteria breakdown plus an explicit "Confirm, move to next phase" button when eligible — never a silent change. If a provider is required, it shows "waiting on your provider to confirm" after the patient acknowledges alone.

**Unit tests (30 new, all pure — no database):** every criteria type individually (met/unmet/boundary/insufficient-data for each), `provider_hold` overriding an otherwise-fully-passing phase, unrecognized criteria never silently passing, a combined-phase test mirroring the real seeded ACL phase 1 exit criteria, and the full acknowledgment gate matrix (no-provider case, provider-required-but-not-acked case, both-acked case, manual-hold-always-wins case).

**Verified live, twice:**
1. Against the **real seeded data** (Jamie, the rotator-cuff test user from milestone 4): clicked through Start Session → red-flag check → session-placeholder, and the engine correctly reported "Not yet eligible" with a transparent per-criterion breakdown — `min_days_since_surgery` met (287 days), `max_pain_score` **not** met (no pain score logged yet, since real session logging is milestone 6), and `min_passive_forward_flexion_degrees` correctly flagged as having no automated evaluator. This is the expected, honest outcome given what data currently exists.
2. Against a **synthetic protocol with only fully-supported criteria** (created and torn down via a throwaway script, to prove the "becomes eligible → prompt → acknowledge → phase actually advances" pipeline works end to end without needing real ROM data): confirmed via direct HTTP calls that (a) a single patient acknowledgment advances the phase when no provider is assigned, and (b) when a provider *is* assigned, the patient acknowledging alone leaves `currentPhaseId` unchanged, and only the provider's subsequent acknowledgment triggers the actual advancement — exactly the dual-acknowledgment behavior the spec requires.

**Assumptions / gaps flagged for follow-up:**
- No ROM, symmetry-index, or stance-time data is collected anywhere in the app yet. Every phase in both seeded protocols includes at least one such criterion, so **neither seeded protocol will ever show full automated eligibility** until that data collection is built (likely as part of, or alongside, milestone 6/7) and a matching evaluator is added to `criteria.ts`'s registry. This is intentional, not a bug — flagging it clearly so it isn't mistaken for the engine being broken.
- `GET /program-engine/instances/:id` (status) is currently restricted to the owning patient; the provider portal (milestone 8) will need its own authorized read path.
- Pain-score history currently only exists via whatever creates `SessionLog` rows — right now that's only the red-flag-check endpoint (which doesn't collect pain score) and my one-off test script. Real pain-score logging arrives with milestone 6's session execution UI.

Proceeding to **Milestone 6: Session execution UI (mobile)**.

## Milestone 6: Session execution UI — DONE

**What was built:**
- Backend: `GET /program-instances/:id/today-session` (returns the current phase's name and its `PhaseExercise` list with prescriptions and exercise media URLs), `PATCH /session-logs/:id/complete` (logs per-exercise sets/reps/hold-time completed, pain score 0-10, RPE 1-10 onto the `SessionLog` the milestone-4 red-flag check already created — rejects if the session log isn't the caller's, or if that session was actually blocked by the red-flag check). New unit tests cover the ownership/blocked-session guards (4 tests).
- Mobile: `mobile/src/app/session.tsx` replaces the old placeholder screen. Shows the real phase name and exercise list from the seeded protocol content (milestone 2), each with sets/reps/hold-time, a demo-media slot (renders the image if `Exercise.imageUrl` is set, otherwise an explicit "No demo media yet" placeholder — no seeded exercise has real media yet, S3 upload is a separate build order item), and a "Mark complete" toggle. Completing an exercise starts a 30-second rest timer (`RestTimer.tsx`, skippable). Once every exercise is marked done, an RPE (1-10) and pain score (0-10) picker (`ScalePicker.tsx`) appears; "Finish session" is disabled until both are set.
- Finishing a session calls `PATCH .../complete`, then immediately calls the milestone-5 Adaptive Program Engine's check-eligibility endpoint and renders the same criteria-breakdown/acknowledgment UI built in milestone 5 — this is the same code path, just moved from the placeholder into the real session screen so logging a genuine pain score can actually feed the engine.

**Verified live, full loop:** ran both servers, logged in as the milestone-4 rotator-cuff test user (Jamie), started a session, saw all 6 real Phase 1 exercises with correct sets/reps/hold-times, marked each complete (confirmed the rest timer and skip control work), picked RPE 3 / pain 2, finished the session, and confirmed in Postgres that the `SessionLog` row has the exact per-exercise `exerciseResults`, `painScore: 2`, and `rpe: 3`. The subsequent engine check now showed `max_pain_score` as **met** (previously blocked on "no pain score logged yet" during the milestone-5 test) — direct proof the two milestones are wired together correctly, with only the still-unimplemented ROM criterion blocking full eligibility, as expected.

**Assumptions / scope notes:**
- Exercise completion is tracked as a single "done" toggle per exercise (populating the prescribed sets/reps/hold-time as "completed" values) rather than letting the user edit actual sets/reps performed. Editable actual-vs-prescribed tracking would be a reasonable enhancement but wasn't asked for explicitly and adds meaningful UI complexity.
- Rest timer is a fixed 30 seconds for every exercise; the data model doesn't currently carry a per-exercise rest duration. Easy to add to `PhaseExercise` later if real content needs it.
- If a program instance's current phase has no exercises assigned, the screen shows a "Continue" fallback that still completes the session log (with pain score 0 / RPE 1) so the flow never dead-ends — this shouldn't happen with the seeded content but could if a protocol template lookup fails.

Proceeding to **Milestone 7: Outcome tracking (KOOS/QuickDASH PROMs)**.

## Milestone 7: Outcome tracking — DONE

**Important copyright/licensing call made here:** KOOS and QuickDASH are real, validated, licensed patient-reported outcome measures — their actual item wording is owned/licensed content (QuickDASH specifically requires a license from the Institute for Work & Health to use in a product). Per the project's own rule against fabricating clinical content, I did **not** reproduce the real question text. Instead, `backend/src/outcome-assessments/prom-definitions.ts` defines clearly-labeled placeholder questionnaires — same domains/item-count/response-scale shape as the real instruments, every item prefixed `[Placeholder ...]`, with an explicit citation field stating the real instrument's license must be obtained before production use. This lets the full pipeline (data model → scoring → trend chart) be built and demoed honestly without either inventing clinical content or reproducing copyrighted material.

**What was built:**
- `prom-definitions.ts` — placeholder KOOS (5 items, one per real KOOS subscale, 0-4 scale, higher=better) and placeholder QuickDASH (11 items matching the real item count, 1-5 scale) definitions, plus `promTypeForRegion()` (knee → KOOS, shoulder → QuickDASH; everything else currently has no configured PROM, matching what's actually seeded).
- `scoring.ts` — `scoreKoos` (simple 0-100 normalization, since our placeholder has only one item per subscale rather than the real multi-item-per-subscale KOOS) and `scoreQuickDash` (the standard, publicly-documented DASH transformation `((mean of n responses) - 1) × 25` — this is a scoring **methodology**, not owned item content, so implementing the real formula is appropriate even though the item text is a placeholder). 9 new unit tests cover both scoring functions at their boundaries and via `scoreForDefinition`.
- `outcome-assessments.service.ts` / controller: `GET /outcome-assessments/definition?injuryProfileId=` (resolves the right PROM from the injury's region), `POST /outcome-assessments` (validates every answer is in-range for its question, computes the score, encrypts `rawAnswers` via the milestone-1 `EncryptionService` before storing — verified as real ciphertext in Postgres, not plaintext), `GET /outcome-assessments` (score+date only, for the trend view — deliberately never decrypts raw answers for a list/trend read).
- Mobile: `outcome-assessment.tsx` (renders the questionnaire, reusing the `ScalePicker` component from milestone 6, shows the placeholder citation at the bottom) and `outcome-trend.tsx` (a plain proportional-bar trend chart — no charting library, matching "a simple trend chart" rather than a full analytics dashboard). Two new buttons on Home for cleared recovery-track users.

**Verified live:** ran both servers, took the questionnaire as Jamie (the shoulder/rotator-cuff test user) — confirmed it correctly resolved to the QuickDASH-shaped placeholder (11 items, 1-5 scale) based on region, answered all items with "2", submitted, and the trend screen correctly showed a score of 25 (`(2-1)×25`) with the right axis label ("lower is better" for QuickDASH). Confirmed in Postgres that `rawAnswers` is genuine ciphertext and `type`/`score` are correct.

**Also hit and fixed an environment issue:** an unrelated process on this machine was already bound to port 3000 (not one of our own servers). Rather than kill a process I don't control, moved the backend dev server to port 3001 (`backend/.env`'s `PORT`, `.claude/launch.json`, and `mobile/.env`'s `EXPO_PUBLIC_API_URL` all updated to match).

**Assumptions / flagged for follow-up:**
- The placeholder KOOS score is a single aggregate rather than the real instrument's five separate subscale scores — a real clinical integration should track pain/symptoms/ADL/sport/QoL separately, as KOOS does.
- No reminder/scheduling exists yet for "periodic" — a user can retake the questionnaire anytime from Home, but nothing prompts them on a schedule. That would use the Firebase/Postmark notification stack once configured (same gap noted in milestone 4).
- **Before any real deployment: the actual KOOS citation/terms and a QuickDASH license from the Institute for Work & Health must be obtained, and a licensed clinician must confirm the scoring implementation against the official manuals** — this build only proves the pipeline, not clinical validity.

Proceeding to **Milestone 8: Provider portal (web)**.

## Milestone 8: Provider portal (web) — DONE

**This is the first web-app milestone**, scaffolded with Vite + React + TypeScript (`web/`), React Router for navigation, and the same dev-auth pattern as mobile (see the recurring Auth0 gap noted since milestone 3).

**What was built:**
- Backend `backend/src/provider-portal/`: `GET /provider/patients` (list, with region/current-phase/sessions-this-week/latest-pain/latest-PROM/hold-status), `GET /provider/patients/:id` (full detail — injury, program instance, last 20 sessions, full PROM history), `GET /provider/patients/:id/red-flag-alerts` (every triggered red-flag check from milestone 4), `POST .../hold`, `.../release-hold`, `.../advance` (manual phase override). Every endpoint verifies a real active `ProviderAssignment` row exists before returning anything — that's the actual authorization boundary, not just the `PROVIDER` role label.
- `patient-summary.ts` — two pure helpers (`countCompletedSessionsSince`, `recentPainTrend`), unit tested (5 new tests). Deliberately does **not** compute an "adherence %" against some assumed prescribed frequency — the data model has no scheduled-session cadence to compare against, and inventing one would be exactly the kind of fabricated clinical metric the project brief warns against. Instead it reports a plain "sessions this week" count.
- **`AuditLog` gets its first real use** (it sat unused since milestone 1, added ahead of need for this non-functional requirement): every `getPatientDetail` call writes a `VIEW_PATIENT_DATA` entry, and every hold/release/manual-override writes its own distinctly-named audited action with full metadata (reason, from/to phase, program instance). Verified all four action types landed correctly in Postgres with correct actor/target/metadata.
- Manual phase override (`manuallySetPhase`) is explicitly separate from the milestone-5 engine's criteria-based path: it bypasses `evaluatePhaseExitCriteria` entirely (a deliberate clinician judgment call), clears any pending engine prompt, and syncs the milestone-1 denormalized `InjuryProfile.currentPhaseId` — confirmed via direct query that both stayed in sync after the override.
- Web UI (`web/src/pages/`): `PatientsListPage` (table with status badges — Hold/Pending ack/Active), `PatientDetailPage` (injury summary, red-flag alert banner, session history table, PROM history table, hold controls, manual-phase-override control, and an "Acknowledge advancement" button that calls the existing milestone-5 provider-acknowledge endpoint — no new backend code needed there, it already supported the provider role).

**Verified live, full loop:** logged in as a demo provider (`dr.smith@example.com`), saw Jamie (the recurring rotator-cuff test patient) correctly listed with region/phase/sessions/pain/PROM data, opened the detail view (saw the historical red-flag alert from milestone 4 and the PROM score from milestone 7), placed a hold with a reason (UI updated immediately, confirmed the reason text round-tripped), released it, then manually advanced Jamie from Phase 1 to Phase 2 with a documented reason — confirmed in Postgres that `currentPhaseId` changed, `InjuryProfile.currentPhaseId` stayed in sync, and all four actions (2× view, hold, release, override) produced correctly-detailed `AuditLog` rows.

**Bug caught and fixed during this milestone's own live testing:** the initial query nested `outcomeAssessments` under each `ProgramInstance` relation, but the mobile PROM submission flow (milestone 7) never actually passes a `programInstanceId` (it's optional), so real assessments were silently invisible to the provider portal ("Latest PROM: —" even though Jamie had one on record). Fixed by querying `OutcomeAssessment` directly by patient id instead, matching how the mobile trend chart already did it correctly. This is exactly the kind of gap that live-testing across milestones (rather than testing each in isolation) catches.

**Also hit (again) the local dev Postgres sandbox's instability:** mid-testing, the `prisma dev` sandbox dropped its connection entirely (`P1001: Can't reach database server`) for about a minute, causing two real 500s in the running backend (visible in server logs, not swallowed). Restarted the sandbox (`npx prisma dev start default`) and the backend process; all prior data (Jamie's full history) was intact on the same underlying volume — nothing was lost, but this is now the third distinct instability mode from this specific local tool across the session (shadow-DB conflicts in milestone 2, prepared-statement pooling in milestone 2, now a full connectivity drop). **Flagging clearly: this sandbox is not reliable enough to keep using for anything beyond this build's own interactive demos — point `DATABASE_URL` at a real Postgres (Docker or managed) before any shared/staging use.**

**Assumptions / scope notes:**
- No provider/patient invite flow exists yet (that's explicitly build order item 10). For this milestone's demo, `backend/prisma/dev-assign-provider.ts <providerEmail> <patientEmail>` is a small permanent dev script that wires up a demo assignment directly — clearly labeled as a stand-in, not a real invite system.
- The provider portal has no way yet to browse *all* patients in an org, only patients explicitly assigned to the logged-in provider — correct scoping for now, and organization-wide provider/admin views are also item 10's territory.
- `GET /program-engine/instances/:id` (status, used by the "Acknowledge advancement" button's underlying read) is still patient-only per milestone 5's note; the "Acknowledge" button on the portal calls the acknowledge endpoint directly without a separate provider-facing status read, which works but means the portal doesn't yet show *why* a phase became pending — a reasonable follow-up enhancement.

Proceeding to **Milestone 9: Performance track (general fitness)**.

## Milestone 9: Performance track (general fitness) — DONE

**Schema decision:** the build order explicitly says to reuse "the same Exercise and SessionLog data model but without the phase-gating logic" — not `Phase`/`ProtocolTemplate`, which are injury-region-specific gating structures that don't make sense for general fitness. So this milestone adds two new models: `PerformanceProgramTemplate` (goal + name/description) and `PerformanceProgramExercise` (the join to `Exercise` with sets/reps/hold-time, mirroring `PhaseExercise`'s shape). `ProgramInstance` gained a `performanceProgramTemplateId` FK alongside its existing `performanceGoal` field from milestone 1.

**What was built:**
- Seeded 3 general templates (`prisma/seed.ts`): Strength (squat/bench/deadlift/row/press/plank), Hypertrophy (higher-rep compound + isolation), Conditioning (jump rope/burpees/kettlebell/mountain climbers/battle ropes/row intervals) — 20 new generic `Exercise` rows, distinct from the rehab-placeholder ones. These are ordinary general-fitness programming, not medical content, so they don't carry the clinical `reviewedBy` gate the recovery protocols do.
- `program-instances.service.ts`: `getTodaySession` now normalizes **both** tracks into the same response shape (recovery's `currentPhase.phaseExercises` or performance's `performanceProgramTemplate.exercises`) — the mobile session screen from milestone 6 needed zero changes to work for performance workouts, confirmed live. Added `startPerformanceProgram` (enroll/reuse by goal) and `graduateToPerformance` (marks the recovery instance `COMPLETED`, creates a new performance instance linked via the milestone-1 `graduatedFromId` self-relation — recovery history is preserved, never deleted).
- `session-logs.service.ts`: `startPerformanceSession` creates a bare `SessionLog` with **no red-flag checklist** — that gate is specifically a recovery-track safety measure (build order item 4); a healthy gym member doesn't get a surgical-recovery symptom checklist in front of a workout.
- Mobile: `performance-goal.tsx` (goal picker, reused for both fresh sign-up and the graduate flow via a `graduateFromInstanceId` param), and `session.tsx` extended with a `track` param so a performance-track session skips the Adaptive Program Engine check entirely and shows a plain "workout logged" confirmation instead of a phase-eligibility card.

**Verified live, twice:**
1. A fresh non-injured user (Sam) went through onboarding choosing "healthy gym member," picked Conditioning, and ran a full workout — all 6 seeded conditioning exercises rendered with correct prescriptions, RPE/pain logging worked, and Postgres confirmed the `SessionLog` had `redFlagTriggered: false` with no checklist ever presented, and the `ProgramInstance` correctly had `injuryProfileId: null`/`currentPhaseId: null` (fully independent of the recovery structures).
2. Jamie (the recurring rotator-cuff recovery patient) used the new "Graduate to performance track" button, picked Strength, and the backend correctly marked her recovery instance `COMPLETED` while creating a new active performance instance.

**Bug caught and fixed by that second live test:** after graduating, Home still showed recovery-track UI and a "Start today's session" button — because the screen branched on "does an `injuryProfile` exist" rather than "which `ProgramInstance` is actually active," and `injuryProfile` never goes away after graduation. Clicking that button would have silently re-enrolled her back into recovery Phase 1 via `ensureActiveRecoveryInstance` (which just checks for an *active* recovery instance and creates one if none exists — it had no way to know she'd graduated). Fixed by making an active performance instance take priority in Home's branching, confirmed live afterward: reloading Jamie's Home now correctly shows "Your strength program is set up."

**Assumptions / scope notes:**
- "Program builder" is implemented as **template selection by goal**, not a free-form custom builder — matching the spec's own wording ("templated programs by goal"). A true builder (custom exercise selection/ordering) would be a larger, separate feature.
- Graduating is a one-way, user-initiated action with no criteria gate (unlike recovery phase advancement) — build order item 9 doesn't specify graduation criteria, so it's left to user judgment, same as starting a fresh performance program.

Proceeding to **Milestone 10: Org/admin basics**.

## Milestone 10: Org/admin basics — DONE (final build-order milestone)

**What was built:**
- Schema: `OrgInvite` (email, role `PROVIDER`/`MEMBER`, unique token, status `PENDING`/`ACCEPTED`/`REVOKED`, who invited whom). `Organization` and `Subscription` already existed from milestone 1 — this milestone is what finally uses them.
- `backend/src/organizations/`: `POST /organizations` (create org + stub `TRIAL`/`TRIALING` subscription via schema defaults, promotes the creator to `ORG_ADMIN`), `GET /organizations/mine` (org + roster + subscription; pending invites only visible to admins), `POST /organizations/:id/invites` (admin-only), `POST /organizations/invites/:inviteId/revoke`, `POST /organizations/invites/:token/accept`.
- **Honest placeholder for email delivery** (same pattern as the milestone-4 provider notification and milestone-8 audit logging): no Postmark/email service is configured, so invites aren't silently claimed as "sent." Instead, the invite token is returned directly to the admin (shown in the web UI) to share manually, and accepting is "enter the token you were given" rather than a clicked email link. This is flagged clearly rather than faking delivery that doesn't happen.
- **Subscription is explicitly a stub**, exactly as instructed ("do not integrate real payment processing until explicitly asked") — no Stripe, no billing UI beyond displaying plan/status/seats.
- Web (`web/src/pages/OrganizationPage.tsx`): create-org form, member roster table, invite form (provider/member + role), pending-invites table with revoke. Linked from the patients list header.
- Mobile (`mobile/src/app/accept-invite.tsx`): a token-entry screen for redeeming an invite, linked from Home — members are mobile-app users, so this is where they'd actually join an org their gym/clinic set up.

**Real bug caught by live-testing (again) and fixed immediately:** `GET /organizations/mine` legitimately returns `null` for a user with no org yet. NestJS sends a genuinely **empty HTTP body** for a handler returning `null` — not the literal text `"null"` — and both the web and mobile `apiFetch` clients called `response.json()` unconditionally on any non-204 response, which throws `SyntaxError: Unexpected end of JSON input` on an empty body. This silently broke the org page (stuck on "Loading…" with an uncaught promise rejection in the console). Fixed in **both** `web/src/api/client.ts` and `mobile/src/api/client.ts` (same latent bug, same fix): read the response as text first and only `JSON.parse` it if non-empty, otherwise resolve to `null`. This is a good example of why treating "does it typecheck" and "does it actually run" as separate questions keeps paying off — this bug was invisible to `tsc` and would have shipped.

**Verified live, full loop, across all three apps:** created "Riverside Sports Medicine Clinic" as `dr.smith@example.com` in the web portal (confirmed stub subscription fields and self-promotion to `ORG_ADMIN`), invited `jamie@example.com` as a `MEMBER` (confirmed the plaintext token was surfaced, not a fake "email sent" message), switched to the mobile app already logged in as Jamie, entered the token on the new accept-invite screen, and confirmed back in the web portal that Jamie now appears in the member roster with role `MEMBER` and her invite shows `ACCEPTED`.

**Assumptions / scope notes:**
- An invite's email match is checked case-insensitively against the accepting user's own account email — reasonable given there's no real identity verification (Auth0) yet to lean on.
- The provider portal's existing patient list (milestone 8) is *not* scoped by organization — a provider still only sees patients they have an explicit `ProviderAssignment` to, regardless of org membership. Build order item 10 asked for org/invite plumbing, not a retroactive rewrite of milestone 8's access model; org-scoped patient rosters would be a reasonable next step once real multi-org usage exists.
- No org-level admin UI for removing members or changing roles after the fact — only inviting. Kept to what was asked ("ability to invite... under an org").

---

# All 10 build-order milestones are now complete.

A full recap of what's real vs. explicitly stubbed, and the concrete action items before this could touch a real patient, is worth its own pass — see the closing summary below.

## Closing summary

**What's genuinely working, verified live (not just unit-tested), across three apps** (`backend/` NestJS, `mobile/` Expo/React Native, `web/` React provider portal), backed by 63 backend unit tests:

- Full onboarding → branching injury intake → clearance gate → red-flag triage gate → real session execution (sets/reps/hold-timers/RPE/pain) → the Adaptive Program Engine's criteria evaluation and dual-acknowledgment phase advancement → PROM tracking with a trend chart → a provider portal with holds/manual overrides/audit logging → a fully separate performance track with graduation → an org/invite system.
- The two most safety-critical pieces of logic (the Adaptive Program Engine's rule evaluation, and the red-flag gate) are pure, unit-tested functions with no DB dependency — matching the "highest-risk-of-bug component" instruction directly.

**What's deliberately stubbed or placeholder, and why (never silently faked):**
1. **Auth0** — no real tenant provisioned (needs your dashboard access). Every app uses a dev-bypass that's hard-disabled if `NODE_ENV=production`. *Action: create an Auth0 tenant, set `AUTH0_DOMAIN`/`AUTH0_AUDIENCE`, swap the mobile/web login screens for a real SDK.*
2. **All clinical content** (ACL/rotator-cuff protocols, KOOS/QuickDASH questionnaires) is explicitly marked `PLACEHOLDER`/`[Placeholder ...]` and has never been reviewed by a licensed clinician. KOOS/QuickDASH specifically avoid reproducing the real (licensed/copyrighted) instrument text. *Action: licensed clinical review of every protocol before any real patient sees this; obtain a real QuickDASH license.*
3. **Push/email notifications** (Firebase Cloud Messaging, Postmark) were never configured — provider red-flag alerts and org invites are logged/surfaced honestly (a structured warning log, a plaintext token) rather than fabricating "notification sent." *Action: wire real FCM/Postmark once credentials exist; both integration points are already identified in code comments.*
4. **Payment processing** — the `Subscription` model is a stub (`TRIAL`/`TRIALING`, no Stripe), exactly as instructed.
5. **The local dev Postgres sandbox** (`npx prisma dev`) proved unreliable across this session — shadow-DB conflicts, a prepared-statement pooling issue, and one full connectivity drop, all documented as they happened. *Action: point `DATABASE_URL` at a real Postgres (Docker or managed) before any shared or staging use — this was purely a convenience choice for building without installing a system service.*
6. **Range-of-motion/symmetry-index/stance-time data** is never collected, so the engine honestly reports those criteria as blocked pending real data collection rather than fabricating a pass. Every phase in both seeded protocols has at least one such criterion, so neither will ever show full automated eligibility until that data collection is built.
7. **Admin CMS** for editing exercises/phases (non-functional requirement) was not built as a separate milestone — content is currently edited via `prisma/seed.ts` and direct DB access. *Action: a basic authenticated CRUD UI over `ProtocolTemplate`/`Phase`/`Exercise`, likely as an addition to the web app.*
8. **Org-scoped provider rosters** — a provider only sees patients via explicit `ProviderAssignment`, not filtered by shared org membership yet.

**Non-functional requirements status:**
- Encryption at rest for sensitive fields (diagnosis text, PROM answers): done and verified as real ciphertext in Postgres (AES-256-GCM, app-level).
- Audit logging for provider access to patient data: done, verified — every view/hold/release/override writes a distinct `AuditLog` row.
- Role-based access: enforced via real relationship checks (`ProviderAssignment`, org membership, ownership), not just role labels.
- Persistent non-dismissible disclaimer on rehab-content screens: present on every recovery-content screen.
- Unit tests specifically for the Adaptive Program Engine: 30 tests across `criteria.ts`/`advancement.ts`, fully pure.

**A pattern worth naming:** several real bugs in this build were caught only by live end-to-end testing across milestones (the outcome-assessment query gap in milestone 8, the post-graduation Home-screen branching bug in milestone 9, the empty-JSON-body client bug in milestone 10) — none of them would have been caught by `tsc` or by testing each milestone in isolation. That's the reason every milestone in this log includes an actual browser-driven verification, not just "the code compiles."

---

## Post-build-order: Admin CMS for rehab content

The non-functional requirement — "All rehab content must be editable via a simple internal admin CMS... do not hardcode exercises/phases in application code" — wasn't one of the 10 numbered milestones, so it hadn't been built yet. Added it as the first follow-up.

**What was built:**
- `backend/src/admin-cms/`: full CRUD REST API for `ProtocolTemplate`, `Phase` (including the entry/exit criteria JSON), `PhaseExercise` (the sets/reps/hold-time prescription join), and the `Exercise` catalog. Every endpoint is behind a new `AdminCmsGuard` that checks the caller's **real `User.role` row** for `SUPER_ADMIN` (never trusted from the client/token) — same defense-in-depth pattern as `assertOrgAdmin`/`assertAssigned` elsewhere in the codebase. 4 new unit tests cover the guard's decision logic.
- Deleting a `Phase`/`Exercise` that's still referenced elsewhere (e.g. an exercise still assigned to a phase, which has `onDelete: Restrict`) is caught and returned as a clean `409 Conflict` with an explanation, instead of leaking a raw Prisma foreign-key error.
- Creating a protocol template **requires** an explicit `reviewedBy` value rather than silently inheriting the schema's `"PLACEHOLDER..."` default — an admin has to consciously state review status for anything they add.
- Web (`web/src/pages/AdminTemplatesPage.tsx`, `AdminTemplateDetailPage.tsx`, `AdminExercisesPage.tsx`): a template list (with a `⚠` flag on anything still placeholder-reviewed), a detail page to edit template metadata, add/delete phases with raw-JSON editors for entry/exit criteria (matching the engine's own extensible-key design rather than a fixed form), and per-phase exercise assignment against the shared catalog; a separate exercise-catalog CRUD page. Linked from the provider portal's nav.
- **No org-admin CRUD UI change was needed for "who can access this"** — it reuses the existing `RequireAuth` wrapper; the backend guard is the real enforcement, the frontend nav link just doesn't bother hiding itself from non-admins (a 403 message plus refusal is an acceptable v1 UX for an internal tool, per the "even a basic authenticated CRUD UI is fine for v1" instruction).
- `backend/prisma/dev-grant-super-admin.ts` — a dev-only bootstrap script (matching the `dev-assign-provider.ts` pattern from milestone 10) since there's no self-service way to grant the CMS role, by design — that's a sensitive, rare operation that shouldn't have a self-service path even in the real product.

**Verified live:** granted `SUPER_ADMIN` to a test account, logged into the web portal, confirmed the real seeded ACL/rotator-cuff templates render with their placeholder-review warning, edited a template's `sourceCitation` (confirmed the write in Postgres), added an exercise ("Wall Sits") to a phase that didn't have it, confirmed it appeared with the full 60-exercise shared catalog available (rehab + performance exercises in one list), removed it again, and confirmed a non-admin user's request to the same API is correctly rejected with `403 SUPER_ADMIN role required`.

**Assumptions / scope notes:**
- JSON criteria editing is a raw textarea (parsed and validated as JSON on blur, with inline error text for malformed input) rather than a dynamic form generated from known criteria keys — this matches the engine's own design in `criteria.ts`, where any key can appear and unknown ones are handled gracefully, so a fixed form would actually be less faithful to how the system really works.
- No version history/audit trail on CMS edits yet (unlike patient-data access, which does have `AuditLog` entries from milestone 8) — a reasonable addition if multiple admins end up editing the same content.

## Follow-up: performance program templates added to the CMS

The initial CMS pass above deliberately scoped out `PerformanceProgramTemplate`/`PerformanceProgramExercise` (milestone 9's general-fitness content) since the non-functional requirement specifically named "rehab content." Added them next since it's the same pattern and closes the remaining "still only editable via `prisma/seed.ts`" gap.

**What was added:** `GET/POST/PATCH/DELETE /admin/performance-programs`, plus `/admin/performance-programs/:id/exercises` and `/admin/performance-program-exercises/:id` for the exercise assignments — mirroring the rehab endpoints exactly, same `AdminCmsGuard`, same 409-on-FK-conflict handling. Web pages `AdminPerformanceProgramsPage.tsx` and `AdminPerformanceProgramDetailPage.tsx` mirror the protocol-template pages (simpler, since performance programs have no phases — just one flat exercise list). Cross-linked from all three admin pages.

**Verified live:** as the same `SUPER_ADMIN` test account, confirmed all 3 seeded performance templates (Strength/Hypertrophy/Conditioning) list correctly, opened the Strength template and confirmed its real 6 seeded exercises, added "Kettlebell Swing" (an exercise originally seeded for the Conditioning template — confirming the shared exercise catalog works across both rehab and performance content), then removed it again to confirm delete works.

67/67 backend tests pass throughout (no regressions). The admin CMS now covers every templated-content entity in the schema (`ProtocolTemplate`/`Phase`/`PhaseExercise`, `PerformanceProgramTemplate`/`PerformanceProgramExercise`, and the shared `Exercise` catalog) — nothing content-related is hardcoded in application code anymore, satisfying the non-functional requirement in full.
