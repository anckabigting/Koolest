document.addEventListener("DOMContentLoaded", () => {
    // Set minimum booking date dynamically to today
    const dateInput = document.getElementById('bookDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Create cooling breeze particles
    initBreezeFloaterParticles();
});

// Simulates floating breeze elements
function initBreezeFloaterParticles() {
    const container = document.getElementById("breeze-container");
    if (!container) return;

    // Clear existing to avoid duplicate stacks on refresh
    container.innerHTML = "";

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement("div");
        particle.className = "breeze-particle";
        
        const size = Math.random() * 24 + 12; // 12px to 36px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 8}s`;
        particle.style.animationDuration = `${Math.random() * 6 + 8}s`;
        
        container.appendChild(particle);
    }
}

// Form Submission Simulations
function submitBooking(event) {
    event.preventDefault();
    document.getElementById("bookingForm").style.display = "none";
    
    const successMsg = document.getElementById("bookingSuccess");
    if (successMsg) {
        successMsg.style.display = "block";
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Form Submission Simulations for Troubleshooting Reports
function submitReport(event) {
    event.preventDefault();
    document.getElementById("reportForm").style.display = "none";
    const reportSuccess = document.getElementById("reportSuccess");
    if (reportSuccess) {
        reportSuccess.style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Select all elements with the 'reveal' class
    const revealElements = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the 'active' class to trigger the CSS transition
                entry.target.classList.add("active");
                
                // Optional: Stop observing once revealed so it stays visible
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15, // Triggers when 15% of the element is visible in viewport
        rootMargin: "0px 0px -50px 0px" // Triggers slightly before it enters the screen
    });

    revealElements.forEach(element => revealObserver.observe(element));
});

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // 1. REPEATABLE SCROLL REVEAL ANIMATION
    // ----------------------------------------------------
    const revealElements = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add active class when entering viewport
                entry.target.classList.add("active");
            } else {
                // Remove active class when leaving viewport (allows re-triggering)
                entry.target.classList.remove("active");
            }
        });
    }, {
        threshold: 0.15, // Triggers when 15% visible
        rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach(element => revealObserver.observe(element));
});

