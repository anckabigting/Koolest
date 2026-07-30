import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { prisma } from "../../src/assets/libs/prisma.js";
import { verifyAdmin } from "./_verifyAdmin.js";

const redis = Redis.fromEnv();
const adminRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/admin",
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed." });
  }

  // Rate Limiter
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "127.0.0.1";
    const { success } = await adminRatelimit.limit(`admin_issues_${ip}`);

    if (!success) {
      return res.status(429).json({ success: false, error: "Too many requests." });
    }
  } catch (err) {
    console.error("Admin Rate Limiter Error:", err);
  }

  // Verify Admin
  try {
    await verifyAdmin(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ success: false, error: err.message });
  }

  // Fetch Issues
  try {
    const issues = await prisma.issueReport.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: issues });
  } catch (error) {
    console.error("Admin issues fetch error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}

const formattedIssues = issues.map((issue) => ({
  ...issue,
  createdAtFormatted: new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(issue.createdAt)),
}));

return res.status(200).json({ success: true, data: formattedIssues });