# Koolest — Project Progress Documentation

**Last updated:** July 27, 2026
**Status:** Live in production at `koolest.vercel.app`

---

## 1. Project Overview

Koolest is a landing page and booking system for an aircon & washing machine repair service business (Dasmariñas, Cavite, Philippines). It started as a static marketing site and has evolved into a full booking pipeline backed by a real Postgres database, with a protected admin dashboard for managing job status.

---

## 2. Architecture Summary

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  index.html       │───▶│  /api/bookings.mjs    │───▶│  Neon Postgres    │
│  (public booking   │     │  (validates + rate    │     │  (via Prisma +     │
│  form)              │     │   limits + inserts)   │     │   Neon adapter)     │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │ Upstash Redis      │
                          │ (rate limiting)     │
                          └──────────────────┘

┌─────────────────┐     ┌──────────────────────────┐
│  admin.html        │───▶│  /api/admin/bookings.mjs   │
│  (Google Sign-In     │     │  /api/admin/update-status  │
│   protected)          │     │  (verifies Google ID token)│
└─────────────────┘     └──────────────────────────┘
```

Everything runs on **Vercel** as static files + serverless functions — no separate backend server.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Semantic HTML5, CSS3 (custom properties, Grid/Flexbox, keyframe animations), Vanilla JS |
| Backend | Vercel Serverless Functions (Node.js, ES Modules `.mjs`) |
| Validation | Zod (shared schema between API and local test script) |
| Database | Neon (Serverless Postgres) |
| ORM | Prisma, using `@prisma/adapter-neon` driver adapter |
| Rate Limiting | Upstash Redis via `@upstash/ratelimit` (sliding window, 5 req / 10 min / IP) |
| Admin Auth | Google Identity Services (Sign-In with Google) + `google-auth-library` for server-side verification |
| Hosting | Vercel |

---

## 4. Database Schema (`prisma/schema.prisma`)

```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}

model Booking {
  id          String        @id @default(cuid())
  email       String
  phone       String
  bookingDate DateTime      @map("bookingDate")
  createdAt   DateTime      @default(now()) @map("createdAt")
  updatedAt   DateTime      @updatedAt @map("updatedAt")
  fullName    String?       @map("fullName")
  serviceType String        @map("serviceType")
  notes       String?       @map("notes")
  status      BookingStatus @default(PENDING)

  @@map("Booking")
}
```

- New bookings default to `PENDING`.
- `updatedAt` auto-updates whenever a row changes (e.g. admin changes status).

---

## 5. Key Project Structure

```
api/
  bookings.mjs                    # Public booking submission endpoint
  admin/
    _verifyAdmin.js                 # Shared helper — verifies Google ID token + allowed email
    bookings.mjs                     # Admin: list all bookings (Google Sign-In protected)
    update-status.mjs                # Admin: update a booking's status (Google Sign-In protected)
src/
  assets/
    libs/
      validations/
        booking.js                 # Zod schema — booking form validation rules
        test-validation.ts          # Local manual test script for the Zod schema
      prisma.js                     # Prisma Client + Neon adapter setup
      ratelimit.js                   # Upstash rate limiter configuration
  generated/
    prisma/                          # Prisma-generated client (auto-generated, do not edit)
prisma/
  schema.prisma                       # Database schema
index.html                             # Main public landing page + booking form
admin.html                             # Google Sign-In protected admin dashboard
script.js                              # Frontend logic (form handling, validation UX, animations)
style.css                              # Global styles
README.md                              # Setup instructions
```

---

## 6. Feature Log (in the order they were built)

### 6.1 Public Booking Form
- Collects: Full Name, Email, Phone, Service Type, Preferred Schedule Date.
- Submits via `fetch` (no page reload) to `/api/bookings`.
- **Validation (Zod, `booking.js`):**
  - `fullName`: trimmed, min 2 chars, max 100, must match `^[A-Z][a-zA-Z'-]*(\s[A-Z][a-zA-Z'-]*)+$` — requires at least two properly-capitalized words (first + last name).
  - `email`: valid email format, trimmed, lowercased.
  - `phone`: exactly 11 digits.
  - `serviceType`: must be one of a fixed enum list of services.
  - `bookingDate`: coerced to a date, must not be in the past.
  - `notes`: optional, max 500 characters.
- **Frontend UX additions:**
  - Phone input strips non-digit characters live as the user types.
  - Full Name input auto-capitalizes each word live as the user types.
  - Validation errors from the server are shown as **native browser tooltips** anchored to the specific offending field (via `setCustomValidity()` + `reportValidity()`), instead of generic `alert()` popups.

### 6.2 Public Booking API (`api/bookings.mjs`)
- Rejects non-POST requests.
- Resolves client IP (from `x-forwarded-for` or socket) for rate limiting.
- Rate limits via Upstash: **5 requests per 10 minutes per IP**. Blocked requests return `429`.
- Validates payload against the Zod schema; returns `400` with detailed field errors on failure.
- Inserts the booking into Neon via Prisma; returns `200` with the created record on success.
- Returns `500` with error details on unexpected failures (logged server-side via `console.error`).

### 6.3 Database Integration (Neon + Prisma)
- Uses `@prisma/adapter-neon` (driver adapter pattern, not a traditional `pg` Pool).
- Required fixing several deployment-specific issues along the way (see Section 8 — Lessons Learned).

### 6.4 Admin Dashboard (`admin.html`)
- Lists all bookings in a table: Full Name, Email, Phone, Service, Schedule Date, Status, Booked On.
- Per-row **status dropdown** (`PENDING` / `CONFIRMED` / `COMPLETED` / `CANCELLED`) — changing it immediately calls `/api/admin/update-status` and shows a "Saved!" confirmation.
- **Access control evolved in two stages:**
  1. *Initial version:* single shared password, checked via a custom `x-admin-password` header against `ADMIN_PASSWORD` env var.
  2. *Current version:* **Google Sign-In**, restricted to one specific email (`ADMIN_EMAIL` env var). The frontend obtains a Google ID token; the backend verifies it's genuine (via `google-auth-library`) and that the email inside it matches exactly. This is real identity verification, not just a shared secret.
- **Session management:**
  - Google ID tokens naturally expire (~1 hour); any resulting `401`/`403` from the API triggers a clear "Your session has expired. Please sign in again." message.
  - An additional **15-minute inactivity timer** runs independently — if there's no mouse/keyboard/scroll/touch activity for 15 minutes, the admin is automatically signed out with the same message, even before the Google token itself expires.
  - A "Sign Out" button is available for manual logout.

### 6.5 Admin API Endpoints
- `api/admin/_verifyAdmin.js` — shared helper. Extracts the Bearer token, verifies it against Google using `google-auth-library`'s `OAuth2Client.verifyIdToken()`, confirms `email_verified` is true, and checks the email matches `process.env.ADMIN_EMAIL`. Throws with the appropriate status code (`401` for missing/invalid token, `403` for a valid-but-unauthorized account) otherwise.
- `api/admin/bookings.mjs` — GET, returns all bookings ordered by `createdAt desc`.
- `api/admin/update-status.mjs` — POST, validates `id` and `status` (must be one of the four enum values), updates the record via Prisma.

---

## 7. Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled Postgres connection string |
| `DIRECT_URL` | Neon direct connection string (used by Prisma CLI for migrations) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST auth token |
| `GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud Console, used both client-side (rendering the sign-in button) and server-side (verifying token audience) |
| `ADMIN_EMAIL` | The single Google account email authorized to access the admin dashboard |

`ADMIN_PASSWORD` (the earlier password-based approach) has been retired and removed.

All variables must be set in **Vercel → Project Settings → Environment Variables** (Production scope) in addition to a local `.env` file for development. Vercel requires a **redeploy** after any environment variable change — it does not apply retroactively to already-running deployments.

---

## 8. Lessons Learned / Notable Fixes Along the Way

This is worth documenting since several of these were non-obvious and took real debugging effort:

1. **`.ts` files can't be imported directly by a deployed `.mjs` serverless function.** Vercel's Node runtime doesn't transpile TypeScript at runtime the way a local dev server does. Fix: created plain `.js` counterparts (`booking.js`, `prisma.js`, `ratelimit.js`) for anything imported by `bookings.mjs` / admin endpoints, while `.ts` originals remain for local dev/testing convenience.
2. **ESM requires explicit file extensions on relative imports.** `import { PrismaClient } from "../../generated/prisma/client"` failed; needed the full `.../index.js` path.
3. **`"type": "module"` was required in `package.json`** once Prisma's generated client (which uses `import`/`export`) needed to load correctly under Node's module resolution.
4. **Environment variable values can silently break if copy-pasted with extra formatting** (stray quotes, markdown-style brackets) — this caused a cryptic Upstash "invalid URL" error and a Postgres "no connection string" error, both traced back to malformed env var values in the Vercel dashboard, not the actual secrets.
5. **`@prisma/adapter-neon`'s expected usage changed** — newer versions accept a config object (`{ connectionString }`) directly rather than a manually constructed `Pool` instance.
6. **A silent `catch` fallback in the frontend (`showSuccessUI()` on any fetch failure) masked real errors for a long time**, making it look like bookings were succeeding when they were actually failing at the network/server level. Removing this was key to actually diagnosing the underlying issues.
7. **Exposed credentials:** at one point, a screenshot shared during debugging displayed the real `.env` file contents (Neon and Upstash credentials in plaintext). Flagged and credentials were rotated as a precaution.

---

## 9. Known Gaps / Not Yet Built

- **Customer-facing status notifications.** Customers currently have no way to know when their booking status changes (Pending → Confirmed, etc.) — decided direction is **email notification on status change** (likely via Resend), triggered from `update-status.mjs`. Not yet implemented.
- **`notes` field on the booking form** is validated by Zod but should be double-checked that it's actually being passed through to `prisma.booking.create()` in `api/bookings.mjs` — worth a quick audit.
- **No formal Prisma migration history** — schema changes are applied via `prisma db push`, which is fine for a solo/small project but doesn't leave a migration audit trail. Worth revisiting if the team grows.
- **No automated tests** beyond the manual `test-validation.ts` script for the Zod schema.
- **Full Name capitalization rule** currently accepts an all-caps word (e.g. "JUAN") as technically valid since the regex only checks the *first* letter is capitalized — not yet decided whether to tighten this further.

---

## 10. Security Notes

- Admin access requires a genuine, verified Google sign-in matching one specific email — not a shared secret.
- Google ID token audience is checked against `GOOGLE_CLIENT_ID` to prevent token reuse from a different application.
- IP addresses are processed transiently for rate-limiting purposes (via Upstash) but are not stored in the `Booking` table itself.
- `.env` files and any credentials should never be shared via screenshot or plaintext; rotate immediately if this happens.
