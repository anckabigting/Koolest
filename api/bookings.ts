import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bookingSchema } from "../src/assets/libs/validations/booking"; // Adjust path if you moved libs!
import { prisma } from "../src/assets/libs/prisma";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 1. Only allow POST requests for creating a booking
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Use POST.",
    });
  }

  try {
    // 2. Parse request body through Zod Schema
    const validationResult = bookingSchema.safeParse(req.body);

    if (!validationResult.success) {
      // Return 400 Bad Request if validation fails, passing detailed field errors
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors,
      });
    }

    const validData = validationResult.data;

    // 3. Insert record into Neon database using Prisma ORM
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

    // 4. Return success response to the client
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