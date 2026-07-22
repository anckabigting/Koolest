import { bookingSchema } from "../src/assets/libs/validations/booking";
import { prisma } from "../src/assets/libs/prisma";
import { ratelimit } from "../src/assets/libs/ratelimit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Use POST.",
    });
  }

  // 1. Get client IP address for rate-limiting identification
  const xForwardedFor = req.headers["x-forwarded-for"];
  const clientIp = typeof xForwardedFor === "string" 
    ? xForwardedFor.split(",")[0] 
    : req.socket.remoteAddress || "127.0.0.1";

  // 2. Perform Rate Limit Check
  const { success, limit, remaining, reset } = await ratelimit.limit(clientIp);

  if (!success) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please try again later.",
    });
  }

  // Rest of your handler logic...
}