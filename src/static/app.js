document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: obtener iniciales desde un email (parte antes de @)
  function getInitialsFromEmail(email) {
    if (!email) return "?";
    const local = email.split("@")[0] || email;
    const parts = local.split(/[.\-_]/).filter(Boolean);
    if (parts.length === 0) return local.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants</h5>
            <div class="participants-content"></div>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // --- NEW: populate participants inside the card ---
        const participantsContainer = activityCard.querySelector(".participants-content");

        if (!details.participants || details.participants.length === 0) {
          const noPart = document.createElement("p");
          noPart.className = "no-participants";
          noPart.textContent = "No participants yet.";
          participantsContainer.appendChild(noPart);
        } else {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach((pEmail) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            li.dataset.email = pEmail;
            li.dataset.activity = name;

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = getInitialsFromEmail(pEmail);

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = pEmail;

            li.appendChild(avatar);
            li.appendChild(emailSpan);
            // delete button
            const delBtn = document.createElement("button");
            delBtn.className = "participant-delete";
            delBtn.title = "Unregister participant";
            // use an accessible SVG icon instead of × character
            delBtn.innerHTML = `
              <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;
            delBtn.setAttribute('aria-label', 'Unregister participant');
            delBtn.addEventListener("click", async (e) => {
              e.stopPropagation();
              const activityName = li.dataset.activity;
              const email = li.dataset.email;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );

                if (resp.ok) {
                  // remove from DOM and refresh activities to update counts
                  li.remove();
                  // refresh full activities UI to update availability and participant lists
                  fetchActivities();
                } else {
                  const err = await resp.json();
                  console.error("Failed to unregister:", err);
                  alert(err.detail || "Failed to unregister participant.");
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                alert("Network error while unregistering participant.");
              }
            });

            li.appendChild(delBtn);
            ul.appendChild(li);
          });
          participantsContainer.appendChild(ul);
        }
        // --- end new participants code ---
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities UI so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
