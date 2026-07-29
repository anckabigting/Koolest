import { z } from "zod";

export const feedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name is too long")
    .regex(
    /^[A-Z][a-zA-Z'-]*(\s[A-Z][a-zA-Z'-]*)+$/,
    "Please capitalize each name properly (e.g. Juan Dela Cruz)"),

  rating: z.coerce
    .number()
    .int()
    .min(1, "Please select a rating")
    .max(5, "Rating must be between 1 and 5"),

  message: z
    .string()
    .trim()
    .min(5, "Please share a bit more about your experience")
    .max(1000, "Feedback is too long"),
});