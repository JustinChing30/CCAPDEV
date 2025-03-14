const profileButton = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown = document.getElementById("profileDropdown"); // The actual dropdown

// Open the modal when clicking "Change Photo"
function openModal() {
  document.getElementById("changePhotoModal").style.display = "flex";
}

// Close the modal when clicking "Cancel" or outside the modal
function closeModal() {
  document.getElementById("changePhotoModal").style.display = "none";
}

// Trigger file input when clicking "Upload Photo"
function triggerFileInput() {
  document.getElementById("profilePicInput").click();
}

// Ensure the modal does NOT appear automatically when the page loads
window.onload = function() {
  document.getElementById("changePhotoModal").style.display = "none"; // Ensures the modal is hidden initially
};

// Close modal when clicking outside of it
window.onclick = function(event) {
  let modal = document.getElementById("changePhotoModal");
  if (event.target === modal) {
      closeModal();
  }
};

// Open dropdown
profileButton.addEventListener("click", (e) => {
  if (profileDropdown.style.visibility === "visible") { // If dropdown is visible, hide it when button clicked
    profileDropdown.style.opacity = "0";
    profileDropdown.style.visibility = "hidden";
  } else { // If dropdown is NOT visible, show it when button clicked
    profileDropdown.style.opacity = "1";
    profileDropdown.style.visibility = "visible";
  }
});

// Close dropdown when clicking outside of it
document.addEventListener("click", (e) => {
  if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.style.opacity = "0";
    profileDropdown.style.visibility = "hidden";
  }
});