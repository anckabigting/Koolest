import { feedbackSchema } from "../src/assets/libs/validations/feedback.js";
import { prisma } from "../src/assets/libs/prisma.js";
import { ratelimit } from "../src/assets/libs/ratelimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Use POST.",
    });
  }

  try {
    // Client IP resolution for rate limiting (same approach as bookings.mjs)
    const xForwardedFor = req.headers["x-forwarded-for"];
    const clientIp = typeof xForwardedFor === "string"
      ? xForwardedFor.split(",")[0].trim()
      : req.socket.remoteAddress || "127.0.0.1";

    if (ratelimit) {
      const { success } = await ratelimit.limit(clientIp);
      if (!success) {
        return res.status(429).json({
          success: false,
          error: "Too many requests. Please try again later.",
        });
      }
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed.",
        details: validationResult.error.format(),
      });
    }

    const { name, rating, message } = validationResult.data;

    const newFeedback = await prisma.feedback.create({
      data: {
        name,
        rating,
        message,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Feedback submitted successfully!",
      data: newFeedback,
    });
  } catch (error) {
    console.error("Feedback Handler Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
