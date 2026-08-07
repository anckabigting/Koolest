# Koolest
![Koolest](./src/assets/Koolest-main.png)

[![Status](https://img.shields.io/badge/Status-Deployed-00C853)](https://koolest.vercel.app)
[![Audience](https://img.shields.io/badge/Audience-Homeowners%20%26%20Businesses-purple)](https://koolest.vercel.app)
[![Platform](https://img.shields.io/badge/Type-Web%20Application-blue)](https://koolest.vercel.app)

**Live Site:** [koolest.vercel.app](https://koolest.vercel.app)
---
A high-conversion landing page and booking system for **Koolest Aircon & Appliance Services** (Dasmariñas, Cavite, Philippines). Engineered with a modern aesthetic, real-time input formatting, strict server-side validation, rate-limiting, and an automated PostgreSQL database pipeline with a Google-authenticated Admin Dashboard for end-to-end service management.
---
# Preview & Showcase
![Koolest-booking](./src/assets/Koolest-booking.png)
---
![Koolest-feedback](./src/assets/Koolest-feedback.png)

---

# Key Features

* **Modern & Responsive UI/UX:** Built with an Aqua Blue, Cream, and Soft Yellow visual language optimized for high contrast, readability, and mobile responsiveness.
* **Live Automated Booking Pipeline:** Captures appointments with real-time field masks (live Proper Case full-name auto-capitalization and strict 11-digit phone formatting) submitted asynchronously via `fetch`.
* **Smart Booking Boundary Checks & Anti-Abuse:** 
  * Prevents past dates and enforces a minimum 1-day advance notice window.
  * Caps far-future bookings to a 90-day maximum limit.
  * Prevents overbooking by capping daily total submissions (5 slots/day) and blocking exact duplicate client slots.
* **Rate Limiting & Protection:** Leverages Upstash Redis (`@upstash/ratelimit`) with sliding-window rate limiting per IP address to prevent spam and DDoS attempts.
* **Native Inline Validation UX:** Connects server-side validation responses directly to HTML5 constraint validation (`setCustomValidity()` and `reportValidity()`), anchoring error tooltips to specific form inputs.
* **Google OAuth Protected Admin Dashboard:** Secured `/admin.html` control panel for managing bookings (status workflows: `PENDING` → `CONFIRMED` → `COMPLETED` / `CANCELLED`), viewing customer feedback, and inspecting issue escalation reports.
* **Granular Identity Verification:** Server-side token verification using `google-auth-library` ensuring only the designated `ADMIN_EMAIL` can view or update records. Includes auto-logout on a 15-minute inactivity timer.
* **Escalation & Feedback System:** Integrated endpoints for handling customer issue reporting and service feedback collection.

---

## Tech Stack

* **Frontend:** HTML5, CSS3 (Custom CSS Properties, Flexbox, CSS Grid, Keyframe Animations), Vanilla JavaScript (ES6+).
* **Backend:** Vercel Serverless Functions (Node.js runtime, ES Modules `.mjs`).
* **Database & ORM:** Neon Serverless PostgreSQL with Prisma ORM using `@prisma/adapter-neon` and `TIMESTAMPTZ` timezone support set to `Asia/Manila`.
* **Validation:** Zod Schema Validation (`booking.js`).
* **Rate Limiting:** Upstash Redis REST API (`@upstash/redis`, `@upstash/ratelimit`).
* **Authentication:** Google Identity Services (GIS) Client SDK + Server-side Verification (`google-auth-library`).
* **Deployment & Hosting:** Vercel Platform.

---

## System Architecture

```
┌─────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
│       index.html        │      │      /api/bookings.mjs       │      │       Neon Postgres         │
│  (Public Booking Form)  │────▶ │  (Validates, Rate Limits,    │────▶ │  (Prisma + @prisma/adapter- │
└─────────────────────────┘      │   Checks Limits & Inserts)   │      │   neon with Timestamptz)    │
                                 └──────────────────────────────┘      └─────────────────────────────┘
                                                │
                                                ▼
                                 ┌──────────────────────────────┐
                                 │        Upstash Redis         │
                                 │    (Sliding Rate Limiter)    │
                                 └──────────────────────────────┘

┌─────────────────────────┐      ┌──────────────────────────────┐
│       admin.html        │      │   /api/admin/bookings.mjs    │
│  (Google Sign-In        │────▶ │   /api/admin/update-status   │
│   Protected Dashboard)  │      │   (Verifies Google ID Token) │
└─────────────────────────┘      └──────────────────────────────┘
```

---

## Project Structure

```
├── api/
│   ├── bookings.mjs             # Public booking endpoint (validations, date bounds & limits)
│   ├── feedback.mjs             # Public feedback submission endpoint
│   ├── issues.mjs               # Public issue reporting endpoint
│   └── admin/
│       ├── _verifyAdmin.js      # Shared middleware helper for Google OAuth ID token check
│       ├── bookings.mjs         # Protected endpoint: Fetch all customer bookings
│       ├── feedback.mjs         # Protected endpoint: Fetch customer feedback
│       ├── issues.mjs           # Protected endpoint: Fetch customer issue reports
│       └── update-status.mjs    # Protected endpoint: Update booking lifecycle status
├── src/
│   └── assets/
│       └── libs/
│           ├── validations/
│           │   └── booking.js   # Zod validation schema definition
│           ├── prisma.js        # Prisma Client initialization with Neon adapter
│           └── ratelimit.js     # Upstash Redis rate limiter setup
├── prisma/
│   └── schema.prisma            # PostgreSQL models (Booking, Feedback, IssueReport)
├── index.html                   # Main customer landing page & booking modal
├── admin.html                   # Protected management portal
├── script.js                    # Client-side form formatting, modal controls, and state management
├── style.css                    # Design system and responsive layout styling
└── vercel.json                  # Vercel deployment configuration
```

---

## Database Schema Highlights

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
  bookingDate DateTime      @db.Timestamptz(6)
  createdAt   DateTime      @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime      @updatedAt @db.Timestamptz(6)
  fullName    String?
  serviceType String
  location    String?
  notes       String?
  status      BookingStatus @default(PENDING)

  @@map("Booking")
}
```

---

## Development Setup

### Prerequisites
* Node.js (v18+ recommended)
* Vercel CLI (`npm install -g vercel`)
* Neon PostgreSQL Database Instance
* Upstash Redis Instance

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require&options=-c%20timezone=Asia/Manila&channel_binding=require"
DIRECT_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
GOOGLE_CLIENT_ID="your_google_oauth_client_id.apps.googleusercontent.com"
ADMIN_EMAIL="authorized_admin@gmail.com"
```

### Database Migration
Generate the Prisma Client and push your schema to Neon:

```bash
npx prisma generate
npx prisma db push
```

### Running Locally
Start the local serverless development environment using the Vercel CLI:

```bash
vercel dev
```

---

## License

This project is proprietary software developed for Koolest Aircon & Appliance Services. All rights reserved.
