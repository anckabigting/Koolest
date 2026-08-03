import { prisma } from "../src/assets/libs/prisma.js";
import { issueReportSchema } from "../src/assets/libs/validations/issue.js";
import { issueRatelimit } from "../src/assets/libs/ratelimit.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Use POST." });
  }

  try {
    // 1. Extract client IP address for rate limiting
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";

    // 2. Perform Rate Limit check using dedicated issue rate limiter
    const { success, limit, remaining, reset } = await issueRatelimit.limit(ip);

    // Set standard rate limit response headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      return res.status(429).json({
        success: false,
        error: "Too many issue reports submitted. Please try again in 15 minutes.",
      });
    }

    // 3. Zod Schema Validation
    const validation = issueReportSchema.safeParse(req.body);

    if (!validation.success) {
      const formattedErrors = validation.error.format();
      const firstErrorMsg = 
        validation.error.issues?.[0]?.message || 
        "Invalid issue submission data.";

      return res.status(400).json({
        success: false,
        error: firstErrorMsg,
        details: formattedErrors,
      });
    }

    const validatedData = validation.data;

    // 4. Create Issue Report in Neon DB
    const newReport = await prisma.issueReport.create({
      data: {
        name: validatedData.name || null,
        email: validatedData.email,
        issueType: validatedData.issueType,
        details: validatedData.details,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Issue report submitted successfully.",
      data: newReport,
    });
  } catch (error) {
    console.error("Issue Report Error:", error);

    const fallbackMsg = error?.issues?.[0]?.message || error?.message || "Internal Server Error";

    return res.status(500).json({
      success: false,
      error: fallbackMsg,
    });
  }
}