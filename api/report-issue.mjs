import { prisma } from "../src/assets/libs/prisma.js";
import { issueReportSchema } from "../src/assets/libs/validations/issue.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Use POST." });
  }

  try {
    // Use safeParse to prevent unhandled exceptions and safely extract issues
    const validation = issueReportSchema.safeParse(req.body);

    if (!validation.success) {
      // Extract formatted Zod field details for report-issue.js
      const formattedErrors = validation.error.format();
      
      // Safely grab the first error message without relying on error.errors[0]
      const firstErrorMsg = 
        validation.error.issues?.[0]?.message || 
        "Invalid issue submission data.";

      return res.status(400).json({
        success: false,
        error: firstErrorMsg,
        details: formattedErrors, // Passed to frontend for field-level highlighting
      });
    }

    const validatedData = validation.data;

    const newReport = await prisma.issueReport.create({
      data: {
        name: validatedData.name || null,
        email: validatedData.email,
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
    console.error("Issue Report Error:", error);

    // Fallback error handler in case Prisma or another system throws
    const fallbackMsg = error?.issues?.[0]?.message || error?.message || "Internal Server Error";

    return res.status(500).json({
      success: false,
      error: fallbackMsg,
    });
  }
}