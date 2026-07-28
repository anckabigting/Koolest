import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Before a custom domain is verified with Resend, sending is restricted —
// so while EMAIL_TEST_MODE is on, every email is redirected to your own
// inbox instead of the real customer address. Flip EMAIL_TEST_MODE off
// (and set FROM_EMAIL to your verified domain address) once ready to go live.
const TEST_MODE = process.env.EMAIL_TEST_MODE === "true";
const FROM_EMAIL = process.env.FROM_EMAIL || "Koolest <onboarding@resend.dev>";

const STATUS_MESSAGES = {
  CONFIRMED: {
    subject: "Your Koolest booking has been confirmed!",
    heading: "Booking Confirmed!",
    body: "Great news! Your service booking has been confirmed. Our team will arrive as scheduled.",
  },
  COMPLETED: {
    subject: "Your Koolest service is complete",
    heading: "Service Completed!",
    body: "Your service has been marked as completed. Thank you for choosing Koolest!",
  },
  CANCELLED: {
    subject: "Your Koolest booking has been cancelled",
    heading: "Booking Cancelled",
    body: "Your booking has been cancelled. If this wasn't expected, please contact us so we can help.",
  },
  PENDING: {
    subject: "Your Koolest booking is pending",
    heading: "Booking Pending",
    body: "Your booking status has been set back to pending. We'll follow up shortly.",
  },
};

/**
 * Sends a status-change notification email for a booking.
 * Fails silently (logs, doesn't throw) so a booking status update never
 * fails just because email delivery had an issue.
 */
export async function sendStatusChangeEmail(booking) {
  const statusInfo = STATUS_MESSAGES[booking.status];
  if (!statusInfo) return;

  const recipient = TEST_MODE ? process.env.TEST_RECIPIENT_EMAIL : booking.email;
  if (!recipient) {
    console.warn("No recipient email available for status notification — skipping send.");
    return;
  }

  const scheduleDate = new Date(booking.bookingDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: statusInfo.subject,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fffdf6;">
          <h2 style="color: #3f8083; margin-bottom: 4px;">${statusInfo.heading}</h2>
          <p style="color: #2d3748; font-size: 15px; line-height: 1.6;">
            Hi ${booking.fullName || "there"},<br /><br />
            ${statusInfo.body}
          </p>
          <div style="background: #e6f7f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; color: #3f8083; font-weight: 700; font-size: 13px; text-transform: uppercase;">Booking Details</p>
            <p style="margin: 4px 0; color: #2d3748; font-size: 14px;"><strong>Service:</strong> ${booking.serviceType}</p>
            <p style="margin: 4px 0; color: #2d3748; font-size: 14px;"><strong>Scheduled Date:</strong> ${scheduleDate}</p>
            <p style="margin: 4px 0; color: #2d3748; font-size: 14px;"><strong>Status:</strong> ${booking.status}</p>
          </div>
          <p style="color: #667; font-size: 13px;">
            Questions? Reply to this email or call us at +63 975 339 6764.
          </p>
          <p style="color: #a0c4c1; font-size: 12px; margin-top: 24px;">— Koolest Aircon Services</p>
        </div>
      `,
    });
  } catch (error) {
    // Log but never throw — a failed email should not fail the status update itself.
    console.error("Failed to send status notification email:", error);
  }
}