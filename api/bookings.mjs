import { bookingSchema } from "../src/assets/libs/validations/booking.ts";
import { prisma } from "../src/assets/libs/prisma.ts";
import { ratelimit } from "../src/assets/libs/ratelimit.ts";

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
    if (ratelimit) {
      const { success } = await ratelimit.limit(clientIp);
      if (!success) {
        return res.status(429).json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      }
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

    const { id, email, phone, booking_date, created_at, full_name, service_type} = validationResult.data;

    // 6. Save to Neon via Prisma
    const newBooking = await prisma.booking.create({
      data: {
        id,
        email,
        phone,
        booking_date: new Date(booking_date),
        created_at: new Date(),
        full_name,
        service_type,
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