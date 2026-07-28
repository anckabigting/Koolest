import { prisma } from "../src/assets/libs/prisma.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { clientName, rating, comment } = req.body;

    if (!clientName || !rating || !comment) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newFeedback = await prisma.feedback.create({
      data: {
        clientName,
        rating: Number(rating),
        comment,
      },
    });

    return res.status(200).json({ success: true, feedback: newFeedback });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}