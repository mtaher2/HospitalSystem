function toggleMenu() {
  const menu = document.getElementById("navigation-menu");
  menu.classList.toggle("open");
}

export function openProfilePhotoModal() {
  document.getElementById("profilePhotoModal").style.display = "block";
}

function closeProfilePhotoModal() {
  document.getElementById("profilePhotoModal").style.display = "none";
}

export function uploadProfilePhoto() {
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

export function showAlert(message, type) {
  const alertDiv = document.createElement("div");
  alertDiv.classList.add("alert");
  alertDiv.classList.add(type === "success" ? "alert-success" : "alert-error");
  alertDiv.textContent = message;

  document.body.appendChild(alertDiv);

  setTimeout(
    () => {
      alertDiv.remove();
    },
    type === "success" ? 5000 : 7000
  ); 
}

const form = document.getElementById("addPatientForm");
form.addEventListener("submit", async function (event) {
  event.preventDefault(); 

  const formData = new FormData(form);

  try {
    const response = await fetch("/add-patient", {
      method: "POST",
      body: formData, 
    });
    if (response.ok) {
      showAlert("Patient added successfully", "success");
    } else {
      showAlert("Failed to add patient", "error");
    }
  } catch (error) {
    showAlert("An error occurred while adding the patient", "error");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const alert = document.querySelector(".alert");

  if (alert) {
    setTimeout(function () {
      alert.remove(); 
    }, 4000);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const contentBody = document.querySelector(".content-body");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      contentBody.style.opacity = "0";
      setTimeout(() => {
        location.href = tab
          .getAttribute("onclick")
          .replace("location.href=", "")
          .trim();
      }, 300);
    });
  });
  window.onload = () => {
    contentBody.style.transition = "opacity 0.3s ease-in-out";
    contentBody.style.opacity = "1";
  };
});

document.addEventListener("DOMContentLoaded", () => {
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

  function checkProfile(doctorName) {
    alert(`Checking profile for ${doctorName}`);
  }

  document.querySelectorAll(".check-account").forEach((button) => {
    button.addEventListener("click", (e) => {
      const doctorName = e.target.closest(".doctor-option").querySelector(".doctor-name").innerText;
      checkProfile(doctorName);
    });
  });
});


