import { prisma } from "../src/assets/libs/prisma.js";
import { issueReportSchema } from "../src/assets/libs/validations/issue.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Use POST." });
  }

  try {
    const validatedData = issueReportSchema.parse(req.body);

    const newReport = await prisma.issueReport.create({
      data: {
        name: validatedData.name || null,
        email: validatedData.email,
        location: validatedData.location || null,
        issueType: validatedData.issueType,
        details: validatedData.details,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Issue report submitted successfully.",
      data: newReport,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Issue Report Error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
}