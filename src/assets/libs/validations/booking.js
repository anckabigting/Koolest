import { z } from "zod";

export const SERVICE_TYPES = [
  "installation",
  "regular-cleaning",
  "full-down-cleaning",
  "dismantling",
  "relocation",
  "troubleshooting",
  "repair",
  "charging-refrigerant",
  "repiping-reinsulation",
  "washing-machine",
];

export const bookingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name is too long")
    .regex(
    /^[A-Z][a-zA-Z'-]*(\s[A-Z][a-zA-Z'-]*)+$/,
    "Please capitalize each name properly (e.g. Juan Dela Cruz)"),

  email: z
  .string()
  .email("Please enter a valid email address")
  .trim()
  .toLowerCase(),
  phone: z
  .string().trim().length(11, "Phone number must be exactly 11 digits").regex(/^[0-9]{11}$/, "Phone number must contain digits only"),
  serviceType: z
  .enum([SERVICE_TYPES[0], ...SERVICE_TYPES.slice(1)], { message: "Please select a valid service type" }),
  
  bookingDate: z
  .coerce.date()
  .refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Booking date cannot be in the past"),
  
  location: z
  .string()
  .trim()
  .min(3, "Please enter a valid service location")
  .max(200, "Location is too long")
  .regex(
    /^[\p{L}\p{N}\s.,'-]+$/u,
    "Location contains invalid characters"
  ),

  notes: z
  .string()
  .max(500, "Notes cannot exceed 500 characters")
  .optional()
  .or(z.literal("")),
});