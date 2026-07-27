import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies the Bearer token in the Authorization header is a genuine Google
 * ID token, and that it belongs to the single allowed admin email.
 * Returns the verified email on success, or throws on failure.
 */
export async function verifyAdmin(req) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    const err = new Error("Missing authorization token.");
    err.statusCode = 401;
    throw err;
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    const authErr = new Error("Invalid or expired token.");
    authErr.statusCode = 401;
    throw authErr;
  }

  if (!payload?.email || payload.email !== process.env.ADMIN_EMAIL) {
    const err = new Error("This account is not authorized.");
    err.statusCode = 403;
    throw err;
  }

  if (!payload.email_verified) {
    const err = new Error("Email not verified with Google.");
    err.statusCode = 403;
    throw err;
  }

  return payload.email;
}