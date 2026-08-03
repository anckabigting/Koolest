import { bookingSchema } from "../src/assets/libs/validations/booking.js";
import { prisma } from "../src/assets/libs/prisma.js";
import { bookingRatelimit } from "../src/assets/libs/ratelimit.js";

export default async function handler(req, res) {
  // 1. HTTP Method Check
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Use POST.",
    });
  }

  try {
    // 2. Client IP Resolution for Rate Limiting
    const xForwardedFor = req.headers["x-forwarded-for"];
    const clientIp = typeof xForwardedFor === "string" 
      ? xForwardedFor.split(",")[0].trim() 
      : req.socket.remoteAddress || "127.0.0.1";

    // 3. Rate Limit Check (Upstash Redis)
    const { success, limit, remaining, reset } = await bookingRatelimit.limit(clientIp);

    // Set standard rate limit headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      return res.status(429).json({
        success: false,
        error: "Too many booking requests. Please try again in 10 minutes.",
      });
    }

    // 4. Ensure Body Parsing
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // 5. Schema Validation (Zod)
    const validationResult = bookingSchema.safeParse(body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed.",
        details: validationResult.error.format(),
      });
    }

    const { email, phone, bookingDate, fullName, serviceType, location } = validationResult.data;

    // 6. Booking Date Bounds Check
    const targetDate = new Date(bookingDate);
    const now = new Date();

    // Reset today's date to midnight for clear day comparison
    const minAllowedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Earliest: Tomorrow
    const maxAllowedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90); // Latest: 90 days out

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format provided.",
      });
    }

    if (targetDate < minAllowedDate) {
      return res.status(400).json({
        success: false,
        error: "Booking date must be at least 1 day in advance.",
      });
    }

    if (targetDate > maxAllowedDate) {
      return res.status(400).json({
        success: false,
        error: "Booking date cannot be more than 90 days in the future.",
      });
    }

    // 7. Database Record Creation
    const newBooking = await prisma.booking.create({
      data: {
        email,
        phone,
        bookingDate: targetDate,
        fullName,
        serviceType,
        location,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Booking successfully recorded!",
      data: newBooking,
    });

  } catch (error) {
    console.error("Serverless Handler Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
}