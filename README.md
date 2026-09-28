# GymRecover

A SaaS platform serving two connected journeys in one app: general strength/fitness training for
healthy gym members, and structured, phase-based orthopedic recovery for users recovering from
surgery or injury. The core differentiator is the **Adaptive Program Engine** — a criteria-based
system that advances a user through clinically-authored rehab phases based on explicit,
inspectable rules, not a black-box model.

**Critical constraint:** this app provides guided exercise education, not medical diagnosis or
treatment decisions. It never outputs a diagnosis, alters a user's phase without meeting explicit
logged criteria, or removes the red-flag safety gate. See [PROGRESS.md](./PROGRESS.md) for the
full build log, what's real vs. placeholder, and outstanding action items before any real
deployment.

**New to this project, or new to coding entirely?** [`docs/getting-started.html`](./docs/getting-started.html)
is a from-scratch, no-experience-required walkthrough — download it and open it in any browser, or
view it rendered directly on GitHub via
[htmlpreview](https://htmlpreview.github.io/?https://github.com/phattrinh1995-beep/gymrecover/blob/main/docs/getting-started.html).

## Repository layout

| App | Path | Stack |
|---|---|---|
| Backend API | [`backend/`](./backend) | NestJS + TypeScript, PostgreSQL (Prisma) |
| Mobile app | [`mobile/`](./mobile) | Expo + React Native + TypeScript |
| Provider/admin web portal | [`web/`](./web) | React + TypeScript (Vite) |

All three talk to the same backend. There is no shared package/monorepo tooling — each is an
independent npm project you install and run separately.

## Prerequisites

- Node.js 20+
- A PostgreSQL database. For quick local development without installing Postgres, this project
  used [`npx prisma dev`](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#prisma-dev)
  (a local Postgres sandbox bundled with Prisma) — see the caveats in PROGRESS.md before relying
  on it beyond a demo.

## Backend setup (`backend/`)

```bash
cd backend
npm install
cp .env.example .env
# Fill in DATABASE_URL at minimum. Leave AUTH_DEV_BYPASS=true for local development
# (no Auth0 tenant is wired up yet — see "Known gaps" below).
npx prisma migrate deploy   # or: npx prisma db push
npm run seed                # loads placeholder rehab protocols + performance templates
npm run start:dev
```

The API listens on `PORT` from `.env` (defaults to 3000; this project's own dev setup used 3001
to avoid a local port conflict — adjust to taste).

Useful scripts:

```bash
npm test        # unit tests (vitest)
npm run build   # typecheck + compile
npm run seed    # re-seed placeholder content (idempotent)
```

Grant yourself CMS/admin access for the web portal's `/admin` pages:

```bash
npx tsx prisma/dev-grant-super-admin.ts you@example.com
```

Create a provider↔patient assignment for local testing (there's no self-service invite flow for
this specific relationship yet — organization invites are separate, see below):

```bash
npx tsx prisma/dev-assign-provider.ts provider@example.com patient@example.com
```

## Mobile app setup (`mobile/`)

```bash
cd mobile
npm install
cp .env.example .env   # point EXPO_PUBLIC_API_URL at your backend
npm run web             # or: npm start, then press a/i for Android/iOS
```

Sign-up in the app is dev-mode only right now: entering an email creates/reuses a local account
with no password or verification (no real Auth0 tenant is provisioned — see "Known gaps").

## Provider/admin web portal setup (`web/`)

```bash
cd web
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev
```

Sign-in is the same dev-mode pattern as mobile. From here you can view assigned patients, manage
organizations/invites, and (for a `SUPER_ADMIN` account) edit rehab/performance content in the
admin CMS at `/admin`.

## Known gaps before any real/production use

These are called out in detail, with the reasoning behind each, in [PROGRESS.md](./PROGRESS.md):

- **No real Auth0 tenant.** Every app currently authenticates via a dev-only header-based bypass
  that is hard-disabled if `NODE_ENV=production`.
- **No rehab content has been clinically reviewed.** Every seeded protocol, phase, and PROM
  questionnaire is explicitly marked as a placeholder and must not be shown to a real patient
  before licensed clinical review.
- **No push/email delivery is configured** (Firebase Cloud Messaging, Postmark) — provider alerts
  and org invites are logged/surfaced honestly rather than faked.
- **No real payment processing** — the `Subscription` model is an intentional stub.
- The local Prisma dev Postgres sandbox is a convenience for building without installing a system
  database; it proved unreliable across long sessions and should be swapped for a real Postgres
  instance before any shared or staging use.

## Testing philosophy

The two safety-critical pieces of business logic — the Adaptive Program Engine's rule evaluation
and the red-flag triage gate — are implemented as pure, dependency-free functions with full unit
test coverage. Beyond that, this project was built with live, browser-driven verification at every
milestone (not just "it compiles") — several real bugs were only caught that way. See
[PROGRESS.md](./PROGRESS.md) for the full history.
