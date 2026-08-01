const GOOGLE_CLIENT_ID = "1027962690032-67mdn9rnofps2peorjbbqljhi9llpr78.apps.googleusercontent.com";

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
let idToken = null;
let expiryTimer = null;
let inactivityTimer = null;
let calendarInstance = null;
let rawBookingsData = [];

const loginGate = document.getElementById("loginGate");
const dashboard = document.getElementById("dashboard");
const loginError = document.getElementById("loginError");
const sessionExpiredMsg = document.getElementById("sessionExpiredMsg");
const refreshBtn = document.getElementById("refreshBtn");
const signOutBtn = document.getElementById("signOutBtn");
const signedInAs = document.getElementById("signedInAs");
const loadingState = document.getElementById("loadingState");
const bookingsTable = document.getElementById("bookingsTable");
const bookingsBody = document.getElementById("bookingsBody");
const emptyState = document.getElementById("emptyState");

// Modal DOM Elements
const detailsModal = document.getElementById("detailsModal");
const modalCloseX = document.getElementById("modalCloseX");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalClientName = document.getElementById("modalClientName");
const modalServiceType = document.getElementById("modalServiceType");
const modalScheduleDate = document.getElementById("modalScheduleDate");
const modalLocation = document.getElementById("modalLocation");
const modalPhone = document.getElementById("modalPhone");
const modalStatusPill = document.getElementById("modalStatusPill");

const savedToken = sessionStorage.getItem("koolest_admin_id_token");
if (savedToken) {
  idToken = savedToken;
  unlockDashboard();
}

/* Reliable Google Sign-In Initialization */
function initGoogleSignIn() {
  if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
    });
    const btnContainer = document.getElementById("googleSignInBtn");
    if (btnContainer) {
      btnContainer.innerHTML = ""; // Clear existing button before re-rendering
      google.accounts.id.renderButton(
        btnContainer,
        { theme: "outline", size: "large", text: "signin_with" }
      );
    }
  }
}

// Fallback trigger if the DOM loads after the script or script fires before DOM
document.addEventListener("DOMContentLoaded", () => {
  initGoogleSignIn();
  setupModalListeners();
});

function setupModalListeners() {
  modalCloseX.addEventListener("click", closeModal);
  modalCloseBtn.addEventListener("click", closeModal);
  detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && detailsModal.classList.contains("open")) {
      closeModal();
    }
  });
}

function openModal(data) {
  modalClientName.textContent = data.clientName || "N/A";
  modalServiceType.textContent = data.service || "N/A";
  modalScheduleDate.textContent = data.scheduleDate || "N/A";
  modalLocation.textContent = data.location || "N/A";
  modalPhone.textContent = data.phone || "N/A";

  modalStatusPill.textContent = data.status || "PENDING";
  modalStatusPill.className = `status-pill ${data.status || 'PENDING'}`;

  detailsModal.classList.add("open");
}

function closeModal() {
  detailsModal.classList.remove("open");
}

async function handleGoogleSignIn(response) {
  idToken = response.credential;
  sessionExpiredMsg.style.display = "none";
  const ok = await loadBookings(true);
  if (ok) {
    sessionStorage.setItem("koolest_admin_id_token", idToken);
    unlockDashboard();
  } else {
    idToken = null;
    loginError.style.display = "block";
  }
}

function unlockDashboard() {
  loginGate.style.display = "none";
  dashboard.style.display = "block";
  loginError.style.display = "none";
  sessionExpiredMsg.style.display = "none";
  initCalendar();
  loadBookings();
  try {
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    signedInAs.textContent = `Signed in as ${payload.email}`;
    scheduleExpiryCheck(payload.exp);
  } catch (e) {
    // ignore decode issues
  }
  startInactivityTracking();
}

function scheduleExpiryCheck(expUnixSeconds) {
  if (expiryTimer) clearTimeout(expiryTimer);
  const msUntilExpiry = expUnixSeconds * 1000 - Date.now();

  if (msUntilExpiry <= 0) {
    expireSession();
    return;
  }
  expiryTimer = setTimeout(expireSession, msUntilExpiry);
}

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

function startInactivityTracking() {
  resetInactivityTimer();
  ACTIVITY_EVENTS.forEach((evt) =>
    document.addEventListener(evt, resetInactivityTimer, { passive: true })
  );
}

function stopInactivityTracking() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  ACTIVITY_EVENTS.forEach((evt) =>
    document.removeEventListener(evt, resetInactivityTimer)
  );
}

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(expireSession, INACTIVITY_LIMIT_MS);
}

function expireSession() {
  sessionStorage.removeItem("koolest_admin_id_token");
  idToken = null;
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  stopInactivityTracking();
  if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  dashboard.style.display = "none";
  loginGate.style.display = "flex";
  loginError.style.display = "none";
  sessionExpiredMsg.style.display = "block";
  initGoogleSignIn();
}

refreshBtn.addEventListener("click", () => loadBookings());
signOutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("koolest_admin_id_token");
  idToken = null;
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  stopInactivityTracking();
  if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  dashboard.style.display = "none";
  loginGate.style.display = "flex";
  loginError.style.display = "none";
  sessionExpiredMsg.style.display = "none";
  initGoogleSignIn();
});

async function loadBookings(isLoginAttempt = false) {
  loadingState.style.display = "block";
  bookingsTable.style.display = "none";
  emptyState.style.display = "none";

  try {
    const res = await fetch("/api/admin/bookings", {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (res.status === 401 || res.status === 403) {
      if (!isLoginAttempt) {
        expireSession();
      }
      return false;
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to load bookings.");

    rawBookingsData = data.data;
    renderBookings(rawBookingsData);
    updateCalendarEvents(rawBookingsData);
    return true;
  } catch (err) {
    console.error("Failed to load bookings:", err);
    loadingState.textContent = "Something went wrong loading bookings.";
    return false;
  }
}

// Keeps everything in its existing relative order, but moves COMPLETED
// bookings to the bottom of the list — so finishing a job clears it out
// of the "active" view without losing the record.
function sortWithCompletedLast(bookings) {
  const active = bookings.filter((b) => b.status !== "COMPLETED");
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  return [...active, ...completed];
}

function renderBookings(bookings) {
  loadingState.style.display = "none";

  if (!bookings || bookings.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  const sorted = sortWithCompletedLast(bookings);

  bookingsTable.style.display = "table";
  bookingsBody.innerHTML = "";

  sorted.forEach((booking) => {
    const row = document.createElement("tr");
    if (booking.status === "COMPLETED") {
      row.classList.add("row-completed");
    }

    const scheduleDate = new Date(booking.bookingDate).toLocaleDateString();
    const bookedOn = new Date(booking.createdAt).toLocaleDateString();

    row.innerHTML = `
      <td>${escapeHtml(booking.fullName || "-")}</td>
      <td>${escapeHtml(booking.email)}</td>
      <td>${escapeHtml(booking.phone)}</td>
      <td>${escapeHtml(booking.serviceType)}</td>
      <td>${escapeHtml(booking.location || "-")}</td>
      <td>${scheduleDate}</td>
      <td>
        <select class="status-select" data-id="${booking.id}">
          ${STATUS_OPTIONS.map(
            (s) => `<option value="${s}" ${s === booking.status ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
        <span class="save-indicator" id="save-${booking.id}">Saved!</span>
      </td>
      <td>${bookedOn}</td>
    `;

    bookingsBody.appendChild(row);
  });

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", () => updateStatus(select));
  });
}

async function updateStatus(select) {
  const id = select.dataset.id;
  const status = select.value;

  try {
    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ id, status }),
    });

    if (res.status === 401 || res.status === 403) {
      expireSession();
      return;
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Update failed.");

    // Update local memory, then re-render both the table (so completed rows
    // sort to the bottom and get highlighted) and the calendar view.
    const target = rawBookingsData.find((b) => b.id === id);
    if (target) {
      target.status = status;
      renderBookings(rawBookingsData);
      updateCalendarEvents(rawBookingsData);

      const indicator = document.getElementById(`save-${id}`);
      if (indicator) {
        indicator.classList.add("show");
        setTimeout(() => indicator.classList.remove("show"), 1500);
      }
    }
  } catch (err) {
    console.error("Status update failed:", err);
    alert(`Failed to update status: ${err.message}`);
  }
}

/* Initialize Calendar View */
function initCalendar() {
  if (calendarInstance) return;
  const calendarEl = document.getElementById("calendar");
  calendarInstance = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek"
    },
    height: "auto",
    dayMaxEvents: 2, // keeps each day cell compact; overflow shows a "+N more" link
    events: [],
    dayCellDidMount: function (arg) {
      // Mark past dates so they render muted/darker, independent of booking status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (arg.date < today) {
        arg.el.classList.add("day-tile-past");
      }
    },
    eventClick: function(info) {
      const props = info.event.extendedProps;
      const formattedDate = new Date(info.event.startStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      openModal({
        clientName: props.clientName,
        service: props.service,
        scheduleDate: formattedDate,
        location: props.location,
        status: props.status,
        phone: props.phone
      });
    }
  });
  calendarInstance.render();
}

/* Transform Bookings into Calendar Events */
function updateCalendarEvents(bookings) {
  if (!calendarInstance) return;

  const visibleBookings = bookings.filter((b) => b.status !== "CANCELLED");

  const events = visibleBookings.map((b) => {
    let color = "#3f8083"; // Dark Aqua (PENDING)
    if (b.status === "CONFIRMED") color = "#2f9e5c"; // Green
    if (b.status === "COMPLETED") color = "#888888"; // Gray

    const dateStr = new Date(b.bookingDate).toISOString().split("T")[0];

    return {
      id: b.id,
      title: `${b.fullName || 'Client'} (${b.serviceType})`,
      start: dateStr,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        clientName: b.fullName || "Client",
        service: b.serviceType,
        location: b.location || "N/A",
        status: b.status,
        phone: b.phone,
        dateStr,
      }
    };
  });

  calendarInstance.removeAllEvents();
  calendarInstance.addEventSource(events);

  // Whole-tile coloring happens after events are in the DOM
  requestAnimationFrame(() => highlightDayTiles(visibleBookings));
}

// Colors the entire day cell (not just the event chip) based on that day's
// dominant status: CONFIRMED takes priority (green), then PENDING (aqua),
// then COMPLETED (gray) if every booking that day is done.
function highlightDayTiles(bookings) {
  // Clear previous status classes first, keep the "past" class intact
  document.querySelectorAll(".fc-daygrid-day").forEach((cell) => {
    cell.classList.remove("day-tile-pending", "day-tile-confirmed", "day-tile-completed");
  });

  const byDate = {};
  bookings.forEach((b) => {
    const dateStr = new Date(b.bookingDate).toISOString().split("T")[0];
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(b.status);
  });

  Object.entries(byDate).forEach(([dateStr, statuses]) => {
    let cssClass = "day-tile-pending";
    if (statuses.includes("CONFIRMED")) {
      cssClass = "day-tile-confirmed";
    } else if (statuses.every((s) => s === "COMPLETED")) {
      cssClass = "day-tile-completed";
    }

    const cell = document.querySelector(`.fc-daygrid-day[data-date="${dateStr}"]`);
    if (cell) cell.classList.add(cssClass);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}