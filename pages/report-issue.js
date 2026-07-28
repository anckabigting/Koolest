document.addEventListener("DOMContentLoaded", () => {
  const bugForm = document.getElementById("bugReportForm");

  if (bugForm) {
    bugForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Show success message or integrate with backend/Formspree/email API
      alert("Thank you for helping us improve our website! Your bug report has been submitted.");
      bugForm.reset();
    });
  }
});