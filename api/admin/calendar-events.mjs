// api/admin/calendar-events.mjs
import { prisma } from "../../src/assets/libs/prisma.js";
import { verifyAdmin } from "./_verifyAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // 1. Verify Admin Authentication
  try {
    await verifyAdmin(req);
  } catch (err) {
    return res.status(err.statusCode || 401).json({ success: false, error: err.message });
  }

  // 2. Fetch Bookings from Database
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: { not: "CANCELLED" }, // Exclude cancelled appointments
      },
      select: {
        id: true,
        fullName: true,
        serviceType: true,
        bookingDate: true,
        status: true,
        location: true,
      },
    });

    // 3. Map to FullCalendar Event Format
    const events = bookings.map((booking) => {
      // Color-code events based on status
      let color = "#3b82f6"; // Default Blue (PENDING)
      if (booking.status === "CONFIRMED") color = "#10b981"; // Green
      if (booking.status === "COMPLETED") color = "#6b7280"; // Gray

      return {
        id: booking.id,
        title: `${booking.fullName || "Client"} - ${booking.serviceType}`,
        start: booking.bookingDate.toISOString().split("T")[0], // YYYY-MM-DD
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          location: booking.location,
          status: booking.status,
        },
      };
    });

    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch calendar events" });
  }
}