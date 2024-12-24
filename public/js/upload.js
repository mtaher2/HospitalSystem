function toggleMenu() {
  const menu = document.getElementById("navigation-menu");
  menu.classList.toggle("open");
}

function openProfilePhotoModal() {
  document.getElementById("profilePhotoModal").style.display = "block";
}

function closeProfilePhotoModal() {
  document.getElementById("profilePhotoModal").style.display = "none";
}

function uploadProfilePhoto() {
  const fileInput = document.getElementById("profilePhotoInput");
  const file = fileInput.files[0];

  if (file) {
    const formData = new FormData();
    formData.append("profilePhoto", file);

    fetch("/uploadProfilePhoto", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          document.querySelector(".avatar").src = data.newImagePath;
          closeProfilePhotoModal(); 
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
