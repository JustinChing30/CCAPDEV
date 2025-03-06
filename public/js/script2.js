const newPostBtn = document.getElementById("newPost"); // Button to open new post overlay
const newPostOverlay = document.getElementById("NewPostOverlay"); // Button to close new post overlay
const profileButton = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown = document.getElementById("profileDropdown"); // The actual dropdown

const newposttextarea = document.getElementById("newPostText");
const newposttitlearea = document.getElementById("newPostTitle");

const closeButtons = document.querySelectorAll(".close-button");

// Open new post overlay
newPostBtn.addEventListener("click", () => {
  newPostOverlay.style.display = "flex";
  newposttextarea.value = '';
  newposttitlearea.value = '';
});

// Close new post overlay by clicking outside of the box
newPostOverlay.addEventListener("click", (e) => {
  if (e.target === newPostOverlay) {
    newPostOverlay.style.display = "none";
    newposttextarea.value = '';
    newposttitlearea.value = '';
  }
});

// Add listener to every both post and reply overlay close button so they do the same thing
closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("NewPostOverlay").style.display = "none";
    
    document.getElementById("new-post-text").value = '';
    document.getElementById("new-post-title").value = '';
  });
});

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