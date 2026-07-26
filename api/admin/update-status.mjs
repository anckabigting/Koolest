import { prisma } from "../../src/assets/libs/prisma.js";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Use POST." });
  }

  // Simple shared-password check
  const providedPassword = req.headers["x-admin-password"];
  if (!providedPassword || providedPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: "Unauthorized." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { id, status } = body;

    if (!id || !status) {
      return res.status(400).json({ success: false, error: "Missing 'id' or 'status'." });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Status updated successfully.",
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Admin update-status error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
