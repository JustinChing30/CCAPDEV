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

document.addEventListener("DOMContentLoaded", () => {
  // Method to get all the like buttons and adjust the list of classes of the like buttons
  document.querySelectorAll(".like-button").forEach((button) => {
    const isLiked = button.getAttribute("data-liked") === "true";
    button.classList.toggle("liked", isLiked); // Apply the "liked" class if true
  });

  // Method for clicking the like button
  document.body.addEventListener("click", async (event) => {
    if (event.target.classList.contains("like-button")) { // check if the element clicked in body is a like-button
      const button = event.target;
      console.log("fetched data: " + button.getAttribute("data-liked"));
      const isLiked = button.getAttribute("data-liked") === "true";
      const postId = button.getAttribute("data-post-id");

      try {
        const response = await fetch(`/like/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ liked: !isLiked })
        });
    
        const data = await response.json();

        console.log(data); // data here is either "true" or "false"

        console.log("Setting attributes...");
        button.setAttribute("data-liked", !isLiked);
  
        button.classList.toggle("liked", !isLiked);

        const likeCount = button.nextElementSibling; // referring to the like-count span group right beside/below the like button
        likeCount.textContent = data.likes; // changes like counter

      } catch (error) {
        console.error("Error toggling like:", error);
      }
    }
  })
})