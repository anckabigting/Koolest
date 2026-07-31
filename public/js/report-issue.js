document.addEventListener("DOMContentLoaded", () => {
  const bugForm = document.getElementById("bugReportForm");
  const messageBanner = document.getElementById("issueMessageBanner");

  // Helper map from select values to Prisma ENUM keys
  const ISSUE_TYPE_MAP = {
    "broken link or button": "BROKEN_LINK_OR_BUTTON",
    "visual/layout glitch": "VISUAL_LAYOUT_GLITCH",
    "form submission error": "FORM_SUBMISSION_ERROR",
    "mobile/screen display problem": "MOBILE_SCREEN_DISPLAY",
    "other website bug": "OTHER_WEBSITE_BUG",
  };

  // Helper function to display message banner
  function showBanner(message, isSuccess = true) {
    if (!messageBanner) return;

    messageBanner.textContent = message;
    messageBanner.className = `form-feedback-banner ${isSuccess ? "success" : "error"}`;
    messageBanner.style.display = "block";

    // Auto-scroll banner into view smoothly
    messageBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  if (bugForm) {
    bugForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Hide previous message if re-submitting
      if (messageBanner) messageBanner.style.display = "none";

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
          showBanner("Bug Report Received! Thank you for helping us improve our site.", true);
          bugForm.reset();
        } else {
          showBanner(result.error || "Failed to submit bug report. Please try again.", false);
        }
      } catch (err) {
        console.error("Submission failed:", err);
        showBanner("An error occurred while submitting your report. Please check your connection.", false);
      }
    });
  }
});