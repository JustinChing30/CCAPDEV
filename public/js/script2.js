const newPostBtn = document.getElementById("newPost"); // Button to open new post overlay
const newPostOverlay = document.getElementById("NewPostOverlay"); // Button to close new post overlay
const profileButton = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown = document.getElementById("profileDropdown"); // The actual dropdown

const newposttextarea = document.getElementById("newPostText");
const newposttitlearea = document.getElementById("newPostTitle");

const closeButtons = document.querySelectorAll(".close-button");

const likeButtons = document.querySelectorAll(".like-button")

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

// The like button toggle
async function toggleLike(button) {
  const postId = button.dataset.postId; // Get post id from button

  const response = await fetch(`/like/${postId}`, { method: "POST" });

  button.classList.toggle("liked"); // Toggle if worked

}

// this is supposed to be to like check if user already liked it
likeButtons.forEach(button => {
  button.addEventListener("click", async () => {
    const postId = button.dataset.postId;

    const response = await fetch(`/like/${postId}`, { method: "POST" });
    const data = await response.json();

    if (data.liked === true) {
      icon.classList.add("like-button liked");
    } 
    else {
      icon.classList.remove("like-button liked");
    }

  });
})