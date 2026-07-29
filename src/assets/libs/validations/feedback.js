import { z } from "zod";

export const feedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(100, "Name is too long"),

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