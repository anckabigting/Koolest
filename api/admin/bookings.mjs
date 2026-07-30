import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { prisma } from "../../src/assets/libs/prisma.js";
import { verifyAdmin } from "./_verifyAdmin.js";

// Initialize Redis client from environment variables
const redis = Redis.fromEnv();

// Create a strict rate limiter for admin endpoints (e.g., 20 requests per minute per IP)
const adminRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/admin",
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Use GET." });
  }

  // 1. Rate Limit Check (Runs BEFORE auth/db queries)
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";
    const { success, limit, remaining, reset } = await adminRatelimit.limit(`admin_bookings_${ip}`);

    // Set rate limit response headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      return res.status(429).json({
        success: false,
        error: "Too many requests to admin endpoint. Please try again later.",
      });
    }
  } catch (rateLimitErr) {
    // Fallback: If Upstash/Redis fails, log the error but allow request to proceed (fail open)
    console.error("Admin Rate Limiter Error:", rateLimitErr);
  }

  // 2. Admin Verification
  try {
    await verifyAdmin(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ success: false, error: err.message });
  }

  // 3. Database Fetch
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Admin bookings fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
}