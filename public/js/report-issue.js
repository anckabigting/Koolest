document.addEventListener("DOMContentLoaded", () => {
  const bugForm = document.getElementById("bugReportForm");
  const reportSuccess = document.getElementById("reportSuccess");
  const messageBanner = document.getElementById("issueMessageBanner");

  // Map input keys to HTML elements for Zod field validation highlighting
  const fieldInputMap = {
    name: () => document.getElementById("reporterName"),
    email: () => document.getElementById("reporterEmail"),
    issueType: () => document.getElementById("issueType"),
    details: () => document.getElementById("issueDetails"),
    message: () => document.getElementById("issueDetails"),
  };

  // Helper map from select values to Prisma ENUM keys
  const ISSUE_TYPE_MAP = {
    "broken link or button": "BROKEN_LINK_OR_BUTTON",
    "visual/layout glitch": "VISUAL_LAYOUT_GLITCH",
    "form submission error": "FORM_SUBMISSION_ERROR",
    "mobile/screen display problem": "MOBILE_SCREEN_DISPLAY",
    "other website bug": "OTHER_WEBSITE_BUG",
  };

  function showBanner(message, isSuccess = true) {
    if (!messageBanner) return;

    messageBanner.textContent = message;
    if (isSuccess) {
      messageBanner.className = "p-4 rounded-xl text-sm font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200";
    } else {
      messageBanner.className = "p-4 rounded-xl text-sm font-semibold border bg-rose-50 text-rose-700 border-rose-200";
    }
    messageBanner.classList.remove("hidden");
    messageBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleZodFieldError(data) {
    // Look through Zod validation details object if returned
    if (data?.details) {
      const firstField = Object.keys(data.details).find(
        (key) => key !== "_errors" && data.details[key]?._errors?.length
      );

      if (firstField && fieldInputMap[firstField]) {
        const message = data.details[firstField]._errors[0];
        const el = fieldInputMap[firstField]();
        if (el) {
          el.setCustomValidity(message);
          el.reportValidity();
          el.addEventListener("input", () => el.setCustomValidity(""), { once: true });
          return true; // Successfully displayed browser field tooltip
        }
      }
    }
    return false;
  }

  if (bugForm) {
    bugForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Clear previous custom validity errors
      Object.values(fieldInputMap).forEach((getEl) => {
        const el = getEl();
        if (el) el.setCustomValidity("");
      });

      if (messageBanner) messageBanner.classList.add("hidden");

      const name = document.getElementById("reporterName")?.value || "";
      const email = document.getElementById("reporterEmail")?.value || "";
      const rawType = document.getElementById("issueType")?.value?.toLowerCase() || "";
      const details = document.getElementById("issueDetails")?.value || "";

      const issueType = ISSUE_TYPE_MAP[rawType] || "OTHER_WEBSITE_BUG";

      // Payload matching Prisma + Zod
      const payload = {
        name,
        email,
        issueType,
        details,
        message: details, // Added duplicate field in case Zod schema expects 'message'
      };

      try {
        const response = await fetch("/api/report-issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          bugForm.classList.add("hidden");
          if (reportSuccess) reportSuccess.classList.remove("hidden");
        } else {
          console.error("API Error Payload:", result);

          // Try popping error directly on input field if Zod returned field error
          const hasFieldError = handleZodFieldError(result);

          // If no specific field matched, show banner error message
          if (!hasFieldError) {
            const errorMsg = result.error || result.message || "Failed to submit bug report. Please try again.";
            showBanner(errorMsg, false);
          }
        }
      } catch (err) {
        console.error("Submission failed:", err);
        showBanner("An error occurred while submitting your report. Please check your connection.", false);
      }
    });
  }
});