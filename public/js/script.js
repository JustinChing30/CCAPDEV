const profileButton = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown = document.getElementById("profileDropdown"); // The actual dropdown

const replyButtons = document.querySelectorAll(".reply-button");
const replyOverlay = document.getElementById("ReplyOverlay");
const newreplytextarea = document.getElementById("newReplyText");

const closeButtons = document.querySelectorAll(".close-button");

// Add listener to every single reply button
replyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    replyOverlay.style.display = "flex";
    newreplytextarea.value = '';
  });
});

// Close reply overlay by clicking outside of the box
replyOverlay.addEventListener("click", (e) => {
  if (e.target === replyOverlay) {
    replyOverlay.style.display = "none";
    newreplytextarea.value = '';
  }
});

// Add listener to every both post and reply overlay close button so they do the same thing
closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("NewPostOverlay").style.display = "none";
    document.getElementById("ReplyOverlay").style.display = "none";
    
    document.getElementById("new-post-text").value = '';
    document.getElementById("new-post-title").value = '';
    document.getElementById("newReplyText").value = '';
  });
});

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
    console.log(button.getAttribute("data-liked"));
    button.classList.toggle("liked", isLiked); // Apply the "liked" class if true
  });

  // Method for clicking the like button in the comments
  document.body.addEventListener("click", async (event) => {
    if (event.target.classList.contains("like-button")) { // check if the element clicked in body is a like-button
      const button = event.target;
      console.log("fetched data: " + button.getAttribute("data-liked"));
      const isLiked = button.getAttribute("data-liked") === "true";
      const commentId = button.getAttribute("data-comment-id");

      console.log("commentId: " + commentId);

      try {
        const response = await fetch(`/likeComment/${commentId}`, {
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