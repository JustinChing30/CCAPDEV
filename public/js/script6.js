const profileButton2 = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown2 = document.getElementById("profileDropdown"); // The actual dropdown
let isDropdownOpen = false; // Track dropdown state

// Open or close dropdown
profileButton2.addEventListener("click", (e) => {
  e.stopPropagation()
  isDropdownOpen = !isDropdownOpen;

  if (isDropdownOpen) {
    profileDropdown2.style.opacity = "1";
    profileDropdown2.style.visibility = "visible";
  } else {
    profileDropdown2.style.opacity = "0";
    profileDropdown2.style.visibility = "hidden";
  }
});

// Close dropdown when clicking outside of it
document.addEventListener("click", (e) => {
  if (
    isDropdownOpen &&
    !profileButton2.contains(e.target) &&
    !profileDropdown2.contains(e.target)
  ) {
    profileDropdown2.style.opacity = "0";
    profileDropdown2.style.visibility = "hidden";
    isDropdownOpen = false;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Method to get all the like buttons and adjust the list of classes of the like buttons
  document.querySelectorAll(".like-button").forEach((button) => {
    const isLiked = button.getAttribute("data-liked") === "true";
    button.classList.toggle("liked", isLiked); // Apply the "liked" class if true
  });

  // Method for clicking the like button (in viewallposts)
  document.body.addEventListener("click", async (event) => {
    if (event.target.classList.contains("like-button")) { // check if the element clicked in body is a like-button
      const button = event.target;
      const isLiked = button.getAttribute("data-liked") === "true";
      const postId = button.getAttribute("data-post-id");

      try {
        // Sends a request to the /like/${postId} method that contains the boolean value of liked in the clicked like button
        const response = await fetch(`/like/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ liked: !isLiked })
        });

        const data = await response.json();

        // Set the attributes of the button properly
        button.setAttribute("data-liked", !isLiked);
        button.classList.toggle("liked", !isLiked);

        const likeCount = button.nextElementSibling; // referring to the like-count span group right beside/below the like button
        likeCount.textContent = data.likes; // changes like counter

      } catch (error) {
        console.error("Error toggling like:", error);
      }
    }
  });
});
