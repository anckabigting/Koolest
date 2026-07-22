import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bookingSchema } from "../src/assets/libs/validations/booking";
import { prisma } from "../src/assets/libs/prisma";
import { ratelimit } from "../src/assets/libs/ratelimit";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Use POST.",
    });
  }

  // 1. Get client IP address for rate-limiting identification
  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "127.0.0.1";

  // 2. Perform Rate Limit Check
  const { success, limit, remaining, reset } = await ratelimit.limit(
    `booking_limiter_${clientIp}`
  );

  // Set rate limit headers so clients know their quota
  res.setHeader("X-RateLimit-Limit", limit.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", reset.toString());

  if (!success) {
    return res.status(429).json({
      success: false,
      error: "Too many booking requests! Please wait a few minutes before trying again.",
    });
  }

  try {
    // 3. Validate form input using Zod
    const validationResult = bookingSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors,
      });
    }

    const validData = validationResult.data;

    // 4. Save to Neon database
    const newBooking = await prisma.booking.create({
      data: {
        fullName: validData.fullName,
        email: validData.email,
        phone: validData.phone,
        serviceType: validData.serviceType,
        bookingDate: validData.bookingDate,
        notes: validData.notes || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Booking submitted successfully!",
      bookingId: newBooking.id,
    });
  } catch (error) {
    console.error("API Route Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error. Failed to save booking.",
    });
  }
}