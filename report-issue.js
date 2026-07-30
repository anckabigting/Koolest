document.addEventListener("DOMContentLoaded", () => {
  const bugForm = document.getElementById("bugReportForm");

  // Helper map from select values to Prisma ENUM keys
  const ISSUE_TYPE_MAP = {
    "broken link or button": "BROKEN_LINK_OR_BUTTON",
    "visual/layout glitch": "VISUAL_LAYOUT_GLITCH",
    "form submission error": "FORM_SUBMISSION_ERROR",
    "mobile/screen display problem": "MOBILE_SCREEN_DISPLAY",
    "other website bug": "OTHER_WEBSITE_BUG",
  };

  if (bugForm) {
    bugForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("reporterName")?.value || "";
      const email = document.getElementById("reporterEmail")?.value || "";
      const location = document.getElementById("reporterLocation")?.value || "";
      const rawType = document.getElementById("issueType")?.value?.toLowerCase() || "";
      const details = document.getElementById("issueDetails")?.value || "";

      const issueType = ISSUE_TYPE_MAP[rawType] || "OTHER_WEBSITE_BUG";

      try {
        const response = await fetch("/api/report-issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, location, issueType, details }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          alert("Thank you! Your bug report has been submitted.");
          bugForm.reset();
        } else {
          alert(`Error: ${result.error || "Failed to submit bug report."}`);
        }
      } catch (err) {
        console.error("Submission failed:", err);
        alert("An error occurred while submitting your report. Please try again.");
      }
    });
  }
});