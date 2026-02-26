/*
  Client-side script for the Activities UI.
  - Loads activities from the API and renders activity cards
  - Handles signup form submissions (POST)
  - Handles unregister actions (DELETE)
  - Provides short-lived user messages
*/

document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset containers before rebuild
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build list of participants with unregister icons.
        // Each participant row contains the email and a small button to remove them.
        let participantsHtml = "<p>No participants yet.</p>";
        if (details.participants.length > 0) {
          participantsHtml = `<ul>${details.participants
            .map(
              (email) =>
                `<li>${email} <button data-activity="${name}" data-email="${email}" class="unregister-btn" title="Unregister">✖</button></li>`
            )
            .join("")}</ul>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Attach event listeners for unregister buttons that were just rendered.
      // We add listeners after rendering so each button gets a handler.
      activitiesList.querySelectorAll(".unregister-btn").forEach((btn) => {
        btn.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // helper for displaying messages
  function showMessage(text, type = "success") {
    // Display a short-lived status message to the user.
    // `type` controls styling (e.g. 'success' or 'error').
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // unregister button handler
  async function handleUnregister(event) {
    const btn = event.target;
    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    // Call the DELETE endpoint and refresh the activities on success.
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister", "error");
      }
    } catch (err) {
      console.error("Error unregistering:", err);
      showMessage("Failed to unregister. Please try again.", "error");
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    // POST to the signup endpoint; if successful, refresh the activities
    // so the newly registered participant appears immediately.
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities(); // refresh the list
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showMessage("Failed to sign up. Please try again.", "error");
    }
  });

  // Initialize app
  // Initial load of data to populate the page on open.
  fetchActivities();
});
