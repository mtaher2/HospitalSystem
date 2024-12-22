function toggleMenu() {
  const menu = document.getElementById("navigation-menu");
  menu.classList.toggle("open");
}

// Function to open the modal
function openProfilePhotoModal() {
  document.getElementById("profilePhotoModal").style.display = "block";
}

// Function to close the modal
function closeProfilePhotoModal() {
  document.getElementById("profilePhotoModal").style.display = "none";
}

// Function to handle the profile photo upload
function uploadProfilePhoto() {
  const fileInput = document.getElementById("profilePhotoInput");
  const file = fileInput.files[0];

  if (file) {
    const formData = new FormData();
    formData.append("profilePhoto", file);

    // Send the image to the server using fetch (POST request)
    fetch("/uploadProfilePhoto", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update the profile image with the new photo
          document.querySelector(".avatar").src = data.newImagePath;
          closeProfilePhotoModal(); // Close the modal after uploading
        } else {
          alert("Failed to upload image. Please try again.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      });
  } else {
    alert("Please select a file to upload.");
  }
}

export { uploadProfilePhoto, openProfilePhotoModal };

// Form validation for National ID
document
  .getElementById("addPatientForm")
  .addEventListener("submit", function (event) {
    const nationalId = document.getElementById("nationalId").value;

    // Check if National ID is 14 digits and starts with 2 or 3
    if (!/^[23]\d{13}$/.test(nationalId)) {
      alert("Please enter Correct National ID.");
      event.preventDefault();
    }
  });

// main.js

function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("alert");
  alertDiv.classList.add(type === "success" ? "alert-success" : "alert-error");
  alertDiv.textContent = message;

  document.body.appendChild(alertDiv);

  // Set timeout to remove the alert after 5 seconds for success or 7 seconds for error
  setTimeout(
    () => {
      alertDiv.remove();
    },
    type === "success" ? 5000 : 7000
  ); // 5000ms = 5 seconds, 7000ms = 7 seconds
}

// Exporting showAlert function for use in other files
export { showAlert };

// Handle form submission
const form = document.getElementById("addPatientForm");

form.addEventListener("submit", async function (event) {
  event.preventDefault(); // Prevent the form from submitting the traditional way

  // Create FormData object from the form
  const formData = new FormData(form);

  try {
    // Send the form data to the backend
    const response = await fetch("/add-patient", {
      method: "POST",
      body: formData, // Send the form data as FormData
    });

    // Check the response status code for success or failure
    if (response.ok) {
      showAlert("Patient added successfully", "success");
    } else {
      showAlert("Failed to add patient", "error");
    }
  } catch (error) {
    // In case of network error or other issues, show error alert
    showAlert("An error occurred while adding the patient", "error");
  }
});

// Wait for the document to load
document.addEventListener("DOMContentLoaded", function () {
  // Select the alert div
  const alert = document.querySelector(".alert");

  if (alert) {
    // After 6 seconds (after the animation ends), remove the alert
    setTimeout(function () {
      alert.remove(); // Remove the alert element
    }, 4000); // Time matches the animation duration
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const contentBody = document.querySelector(".content-body");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Add fade-out effect
      contentBody.style.opacity = "0";
      setTimeout(() => {
        // After fade-out, load content
        location.href = tab
          .getAttribute("onclick")
          .replace("location.href=", "")
          .trim();
      }, 300); // Match animation duration
    });
  });

  // Add fade-in effect
  window.onload = () => {
    contentBody.style.transition = "opacity 0.3s ease-in-out";
    contentBody.style.opacity = "1";
  };
});

document.addEventListener("DOMContentLoaded", () => {
  // Toggle doctor dropdown visibility
  const dropdownHeader = document.querySelector(".dropdown-header");
  const doctorDropdown = document.getElementById("doctor-dropdown");

  function toggleDropdown() {
    if (doctorDropdown) {
      doctorDropdown.style.display =
        doctorDropdown.style.display === "block" ? "none" : "block";
    }
  }

  if (dropdownHeader) {
    dropdownHeader.addEventListener("click", toggleDropdown);
  }

  // Check Account button functionality
  function checkProfile(doctorName) {
    alert(`Checking profile for ${doctorName}`);
  }

  // Attach to buttons
  document.querySelectorAll(".check-account").forEach((button) => {
    button.addEventListener("click", (e) => {
      const doctorName = e.target.closest(".doctor-option").querySelector(".doctor-name").innerText;
      checkProfile(doctorName);
    });
  });
});


