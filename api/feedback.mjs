import { feedbackSchema } from "../src/assets/libs/validations/feedback.js";
import { prisma } from "../src/assets/libs/prisma.js";
import { ratelimit } from "../src/assets/libs/ratelimit.js";

export default async function handler(req, res) {
  // 1. Enforce POST Method
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Use POST.",
    });
  }

  try {
    // 2. Safe IP resolution & Rate limiting
    if (ratelimit) {
      try {
        const xForwardedFor = req.headers["x-forwarded-for"];
        const clientIp = typeof xForwardedFor === "string"
          ? xForwardedFor.split(",")[0].trim()
          : req.socket?.remoteAddress || "127.0.0.1";

        const { success } = await ratelimit.limit(clientIp);
        if (!success) {
          return res.status(429).json({
            success: false,
            error: "Too many requests. Please try again later.",
          });
        }
      } catch (rateLimitErr) {
        console.warn("Rate limit check failed, proceeding without rate limit:", rateLimitErr);
      }
    }

    // 3. Safe Request Body Parsing
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: "Invalid JSON format in request body.",
        });
      }
    }

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        success: false,
        error: "Empty or invalid payload.",
      });
    }

    // 4. Validate with Zod
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed.",
        details: validationResult.error.format(),
      });
    }

    const { name, rating, message } = validationResult.data;

    // 5. Save to Prisma Database (Ensure rating is an Integer)
    const newFeedback = await prisma.feedback.create({
      data: {
        name,
        rating: Number(rating), // Explicitly parse as number for Prisma Int/Float
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
      details: error.message || "An unexpected error occurred.",
    });
  }
}