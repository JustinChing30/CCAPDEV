const newPostBtn = document.getElementById("newPost"); // Button to open new post overlay
const newPostOverlay = document.getElementById("NewPostOverlay"); // Button to close new post overlay

const newposttextarea = document.getElementById("new-post-text");
const newposttitlearea = document.getElementById("new-post-title");

const replyButtons = document.querySelectorAll(".reply-button");
const replyOverlay = document.getElementById("ReplyOverlay");
const newreplytextarea = document.getElementById("new-reply-text");

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

// Add listener to every single reply button
replyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    replyOverlay.style.display = "flex";
    newposttextarea.value = '';
    newposttitlearea.value = '';
  });
});

// Close reply overlay by clicking outside of the box
replyOverlay.addEventListener("click", (e) => {
  if (e.target === replyOverlay) {
    replyOverlay.style.display = "none";
    newreplytextarea.value = '';
    newposttitlearea.value = '';
  }
});

// Add listener to every both post and reply overlay close button so they do the same thing
closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("NewPostOverlay").style.display = "none";
    document.getElementById("ReplyOverlay").style.display = "none";
    
    document.getElementById("new-post-text").value = '';
    document.getElementById("new-post-title").value = '';
    document.getElementById("new-reply-text").value = '';
  });
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