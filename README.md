# Koolest 

An elegant, high-conversion landing page for **Koolest Aircon Services**, engineered with a premium look and a fully automated, database-backed booking system.

This platform showcases specialized air care, handles dynamic maintenance scheduling, persists bookings in a real Postgres database, and features an integrated escalation management framework alongside a Google-authenticated admin dashboard for managing job status end-to-end.

## Features

* **Premium UI/UX:** Built with a modern Aqua Blue, Cream, and Soft Yellow color palette optimized for high visual contrast and user engagement.
* **Live Booking Pipeline:** Frontend form validated in real time (auto-formatting, digit-only phone input, proper-case full name) and submitted via `fetch` to a serverless API, which validates the payload with Zod and writes directly to a Neon Postgres database through Prisma.
* **Rate Limiting & Abuse Prevention:** Booking submissions are rate-limited per IP address using Upstash Redis, with usage trackable via Upstash's Ratelimit Analytics dashboard.
* **Inline Native Validation UX:** Server-side validation errors are surfaced using the browser's native Constraint Validation API, anchoring readable error messages directly to the offending form field instead of generic alerts.
* **Admin Dashboard:** A `/admin.html` page listing all bookings, with per-row status controls to move each job through **Pending → Confirmed → Completed/Cancelled**. Access is restricted via Google Sign-In, verified server-side against a single authorized email — not a shared password.
* **Escalation & Support Management:** Dedicated issue reporting module for immediate customer care and service quality control.
* **Fully Responsive:** Fluid layouts designed to scale beautifully from compact mobile devices to high-resolution desktop screens.

## Tech Stack

* **Frontend:** Semantic HTML5, CSS3 (Custom Variables, Flexbox, Grid, Keyframe Animations), Vanilla JavaScript
* **Backend:** Vercel Serverless Functions (Node.js, ES Modules)
* **Validation:** Zod schema validation, shared between the API and local test scripts
* **Database:** Neon (Serverless Postgres) accessed via Prisma ORM with the `@prisma/adapter-neon` driver adapter
* **Rate Limiting:** Upstash Redis via `@upstash/ratelimit`
* **Admin Authentication:** Google Identity Services (Sign-In with Google) + `google-auth-library` for server-side token verification
* **Hosting/Deployment:** Vercel

## Development Setup
 
1. Install dependencies:
```bash
   npm install
```
 
2. Set up environment variables. These variables must be added under **Vercel → Project Settings → Environment Variables** for Production before deploying. Create a `.env` file in the project root with:
```
   DATABASE_URL=your_neon_pooled_connection_string
   DIRECT_URL=your_neon_direct_connection_string
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ADMIN_EMAIL=the_only_gmail_allowed_to_access_admin
```
  
 
3. Generate the Prisma Client:
```bash
   npx prisma generate
```
 
4. Sync the schema to your Neon database:
```bash
   npx prisma db push
```
 
5. Run locally with the Vercel CLI (recommended, since the booking form relies on serverless API routes):
```bash
   npx vercel dev
```

## Key Project Structure

```
api/
  bookings.mjs              # Public booking submission endpoint
  admin/
    _verifyAdmin.js          # Shared helper: verifies Google ID token + allowed email
    bookings.mjs              # Admin: fetch all bookings (Google Sign-In protected)
    update-status.mjs         # Admin: update a booking's status (Google Sign-In protected)
src/
  assets/
    libs/
      validations/
        booking.js           # Zod schema for booking form validation
      prisma.js               # Prisma Client + Neon adapter setup
      ratelimit.js             # Upstash rate limiter configuration
  generated/
    prisma/                   # Prisma-generated client (do not edit directly)
prisma/
  schema.prisma                # Database schema (Booking model, BookingStatus enum)
index.html                     # Main landing page
admin.html                     # Google Sign-In protected admin dashboard
script.js                      # Frontend interactivity + booking form logic
style.css                      # Global styles
```

## Admin Dashboard

Visit `/admin.html` on your deployed site and sign in with the Google account matching `ADMIN_EMAIL`. Every request to the admin API endpoints carries a Google-issued ID token, which is verified server-side (`api/admin/_verifyAdmin.js`) to confirm both authenticity (the token is genuinely from Google) and authorization (the signed-in email matches the one allowed account). Any other Google account is rejected, even with a valid Google login.

Setting this up requires an OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com) with `koolest.vercel.app` registered as an authorized JavaScript origin and redirect URI.

## Notes

* The `Booking` model includes `status` (`PENDING` | `CONFIRMED` | `COMPLETED` | `CANCELLED`, defaulting to `PENDING`) and an auto-managed `updatedAt` timestamp.
* Booking submissions are capped at 5 requests per 10 minutes per IP address to prevent abuse.
* Full Name is validated to require proper capitalization and at least two words (first + last name).
