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

  // 4. Booking Form Submission & API Request
  const bookingForm = document.getElementById("bookingForm");
  const bookingHeader = document.getElementById("bookingHeader");
  const successMsg = document.getElementById("bookingSuccess");

  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Read values matching index.html IDs
      const formData = {
        fullName: document.getElementById("fullName")?.value || "",
        email: document.getElementById("email")?.value || "",
        phone: document.getElementById("phone")?.value || "",
        serviceType: document.getElementById("service-type")?.value || "", // Fixed ID: service-type
        bookingDate: document.getElementById("bookingDate")?.value || "",
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

        if (data.success) {
          // Hide both the header and form on success
          if (bookingHeader) bookingHeader.style.display = "none";
          bookingForm.style.display = "none";

          // Show success message container
          if (successMsg) {
            successMsg.style.display = "block";
            successMsg.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            alert("Booking confirmed! Thank you!");
          }
          bookingForm.reset();
        } else {
          console.error("Submission error details:", data.details || data.error);
          alert(`Error: ${data.error || "Failed to submit booking."}`);
        }
      } catch (err) {
        console.error("Network error:", err);
        alert("Something went wrong. Please check your connection and try again.");
      }
    });
  }

  // 5. Escalation / Issue Form Submission
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