import { z } from "zod";

// List of allowed aircon service types matching your frontend
export const SERVICE_TYPES = [
  "Wall-Mounted Aircon",
  "Cassette Type Aircon",
  "Floor Standing Aircon",
  "Window Type Aircon",
] as const;

export const bookingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name is too long")
    .trim(),

  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),

  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number format"),

  serviceType: z.enum(SERVICE_TYPES, {
  message: "Please select a valid service type",
}),

  bookingDate: z.coerce.date().refine((date) => {
    // Ensures the date chosen is not in the past (comparing to today's date)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    return date >= today;
  }, "Booking date cannot be in the past"),

  notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")), // Allows empty string or omitted notes
});

// Infer TypeScript type automatically from schema
export type BookingInput = z.infer<typeof bookingSchema>;