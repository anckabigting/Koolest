# Koolest 

An elegant, high-conversion landing page for **Koolest Aircon Services**, engineered with a premium look and a fully automated, database-backed booking system.

This platform showcases specialized air care, handles dynamic maintenance scheduling, persists bookings in a real Postgres database, and features an integrated escalation management framework alongside a password-protected admin dashboard for managing job status end-to-end.

## Features

* **Premium UI/UX:** Built with a modern Aqua Blue, Cream, and Soft Yellow color palette optimized for high visual contrast and user engagement.
* **Live Booking Pipeline:** Frontend form validated in real time (auto-formatting, digit-only phone input, proper-case full name) and submitted via `fetch` to a serverless API, which validates the payload with Zod and writes directly to a Neon Postgres database through Prisma.
* **Rate Limiting & Abuse Prevention:** Booking submissions are rate-limited per IP address using Upstash Redis, with usage trackable via Upstash's Ratelimit Analytics dashboard.
* **Inline Native Validation UX:** Server-side validation errors are surfaced using the browser's native Constraint Validation API, anchoring readable error messages directly to the offending form field instead of generic alerts.
* **Admin Dashboard:** A password-protected `/admin.html` page listing all bookings, with per-row status controls to move each job through **Pending → Confirmed → Completed/Cancelled**, backed by its own protected API endpoints.
* **Escalation & Support Management:** Dedicated issue reporting module for immediate customer care and service quality control.
* **Fully Responsive:** Fluid layouts designed to scale beautifully from compact mobile devices to high-resolution desktop screens.

##  Tech Stack

* **Frontend:** Semantic HTML5, CSS3 (Custom Variables, Flexbox, Grid, Keyframe Animations), Vanilla JavaScript
* **Backend:** Vercel Serverless Functions (Node.js, ES Modules)
* **Validation:** Zod schema validation, shared between the API and local test scripts
* **Database:** Neon (Serverless Postgres) accessed via Prisma ORM with the `@prisma/adapter-neon` driver adapter
* **Rate Limiting:** Upstash Redis via `@upstash/ratelimit`
* **Hosting/Deployment:** Vercel

##  Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/koolest.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables. Create a `.env` file in the project root with:
   ```
   DATABASE_URL=your_neon_pooled_connection_string
   DIRECT_URL=your_neon_direct_connection_string
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   ADMIN_PASSWORD=your_chosen_admin_password
   ```
   These same variables must also be added under **Vercel → Project Settings → Environment Variables** for Production before deploying.

4. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

5. Sync the schema to your Neon database:
   ```bash
   npx prisma db push
   ```

6. Run locally with the Vercel CLI (recommended, since the booking form relies on serverless API routes):
   ```bash
   npx vercel dev
   ```

##  Key Project Structure

```
api/
  bookings.mjs              # Public booking submission endpoint
  admin/
    bookings.mjs             # Admin: fetch all bookings (password-protected)
    update-status.mjs        # Admin: update a booking's status (password-protected)
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
admin.html                     # Password-protected admin dashboard
script.js                      # Frontend interactivity + booking form logic
style.css                      # Global styles
```

##  Admin Dashboard

Visit `/admin.html` on your deployed site and enter the password set in `ADMIN_PASSWORD` to view all bookings and update their status. Access is enforced via a custom header check on both admin API endpoints — there is no separate user account system.

##  Notes

* The `Booking` model includes `status` (`PENDING` | `CONFIRMED` | `COMPLETED` | `CANCELLED`, defaulting to `PENDING`) and an auto-managed `updatedAt` timestamp.
* Booking submissions are capped at 5 requests per 10 minutes per IP address to prevent abuse.
* Full Name is validated to require proper capitalization and at least two words (first + last name).
