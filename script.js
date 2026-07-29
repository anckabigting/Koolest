// Hamburger Mobile Nav
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger-btn") || document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  const navItems = document.querySelectorAll(".nav-links a");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("active");
    });

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });
  }

  // 1. Set minimum booking date dynamically to today
  const dateInput = document.getElementById("bookingDate");
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
  }

  // 2. Create cooling breeze particles
  initBreezeFloaterParticles();

  // 3. Repeatable Scroll Reveal Animation
  const revealElements = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        } else {
          entry.target.classList.remove("active");
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px",
    }
  );
  revealElements.forEach((element) => revealObserver.observe(element));

  // Restrict phone input to digits only, live as the user types
  // (moved outside the submit handler so it only attaches once, not on every submit)
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/[^0-9]/g, "");
    });
  }

  // 4. Booking Form Submission & API Request
  const bookingForm = document.getElementById("bookingForm");
  const bookingHeader = document.getElementById("bookingHeader");
  const successMsg = document.getElementById("bookingSuccess");

  // Maps Zod field names (from the API's validation error object) to the
  // actual input elements, so we can anchor the native tooltip to the right field.
  const fieldInputMap = {
    fullName: () => document.getElementById("fullName"),
    email: () => document.getElementById("email"),
    phone: () => document.getElementById("phone"),
    serviceType: () => document.getElementById("service-type"),
    bookingDate: () => document.getElementById("bookingDate"),
    location: () => document.getElementById("location"),
  };

  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Clear any previous custom validity messages before a fresh attempt
      Object.values(fieldInputMap).forEach((getEl) => {
        const el = getEl();
        if (el) el.setCustomValidity("");
      });

      const formData = {
        fullName: document.getElementById("fullName")?.value || "",
        email: document.getElementById("email")?.value || "",
        phone: document.getElementById("phone")?.value || "",
        serviceType: document.getElementById("service-type")?.value || "",
        bookingDate: document.getElementById("bookingDate")?.value || "",
        location: document.getElementById("location")?.value || "",
      };

      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error("Submission error details:", data.details || data.error);
          showFieldError(data);
          return;
        }

        showSuccessUI();
      } catch (err) {
        console.error("API request failed:", err);
        showGenericError(`Something went wrong: ${err.message}`);
      }
    });
  }

  // Shows the server's validation message as a native browser tooltip,
  // anchored to the exact field that failed (matches built-in HTML5 validation UI).
  function showFieldError(data) {
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
          // Clear it on next input so the browser doesn't keep blocking submission
          el.addEventListener("input", () => el.setCustomValidity(""), { once: true });
          return;
        }
      }
    }
    showGenericError(data?.error || "Failed to submit booking. Please try again.");
  }

  // Fallback for errors that aren't tied to a specific field (e.g. rate limiting,
  // server errors) — shown on the Full Name field since it's first in the form.
  function showGenericError(message) {
    const el = document.getElementById("fullName");
    if (el) {
      el.setCustomValidity(message);
      el.reportValidity();
      el.addEventListener("input", () => el.setCustomValidity(""), { once: true });
    } else {
      alert(message);
    }
  }

  function showSuccessUI() {
    const bookingCard = document.getElementById("bookingCard") || document.querySelector(".booking-card");
    const successMsg = document.getElementById("bookingSuccess");

    // Hide the entire light-blue card container
    if (bookingCard) bookingCard.style.display = "none";

    // Show only the standalone teal success banner
    if (successMsg) {
      successMsg.style.display = "block";
    }
  }

  // 5. Feedback Form Submission & API Request
  const feedbackForm = document.getElementById("feedbackForm");

  if (feedbackForm) {
    feedbackForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const ratingInput = feedbackForm.querySelector('input[name="rating"]:checked');

      const formData = {
        name: document.getElementById("clientName")?.value || "",
        rating: ratingInput?.value || "",
        message: document.getElementById("comment")?.value || "",
      };

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error("Feedback submission error:", data.details || data.error);
          showFeedbackFieldError(data);
          return;
        }

        showFeedbackSuccess();
      } catch (err) {
        console.error("Feedback API request failed:", err);
        alert(`Something went wrong: ${err.message}`);
      }
    });
  }

  function showFeedbackFieldError(data) {
    let message = data?.error || "Failed to submit feedback. Please try again.";

    if (data?.details) {
      const firstField = Object.keys(data.details).find(
        (key) => key !== "_errors" && data.details[key]?._errors?.length
      );
      if (firstField) {
        message = data.details[firstField]._errors[0];
      }
    }

    const nameInput = document.getElementById("clientName");
    if (nameInput) {
      nameInput.setCustomValidity(message);
      nameInput.reportValidity();
      nameInput.addEventListener("input", () => nameInput.setCustomValidity(""), { once: true });
    } else {
      alert(message);
    }
  }

  function showFeedbackSuccess() {
    const formWrapper = document.getElementById("feedbackFormWrapper");
    const successMsg = document.getElementById("feedbackSuccess");

    if (formWrapper) formWrapper.style.display = "none";
    if (successMsg) successMsg.style.display = "block";
  }

  // 6. Escalation / Issue Form Submission
  const issueForm = document.getElementById("issueForm");
  if (issueForm) {
    issueForm.addEventListener("submit", function (e) {
      e.preventDefault();
      issueForm.style.display = "none";
      const formSuccess = document.getElementById("formSuccess");
      if (formSuccess) formSuccess.style.display = "block";
    });
  }
});

// Helper: Simulates floating breeze elements
function initBreezeFloaterParticles() {
  const container = document.getElementById("breeze-container");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.className = "breeze-particle";

    const size = Math.random() * 24 + 12;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 8}s`;
    particle.style.animationDuration = `${Math.random() * 6 + 8}s`;

    container.appendChild(particle);
  }
}

// Slideshow Controller
let slideIndex = 0;
showSlides();

function showSlides() {
  let slides = document.getElementsByClassName("slide");

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  slideIndex++;
  if (slideIndex > slides.length) {
    slideIndex = 1;
  }

  if (slides.length > 0) {
    slides[slideIndex - 1].style.display = "block";
  }
  setTimeout(showSlides, 3000);
}

const backToTopBtn = document.getElementById("backToTopBtn");

// Show button when user scrolls down 300px
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
});

// Smooth scroll to top when clicked
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});