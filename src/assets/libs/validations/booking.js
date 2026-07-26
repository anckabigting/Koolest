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
    .regex(/^\S+\s+\S+/, "Please enter your full name (first and last name)"),
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  phone: z.string().trim().length(11, "Phone number must be exactly 11 digits").regex(/^[0-9]{11}$/, "Phone number must contain digits only"),
  serviceType: z.enum([SERVICE_TYPES[0], ...SERVICE_TYPES.slice(1)], { message: "Please select a valid service type" }),
  bookingDate: z.coerce.date().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, "Booking date cannot be in the past"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional().or(z.literal("")),
});