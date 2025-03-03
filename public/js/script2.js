const newPostBtn = document.getElementById("newPost"); // Button to open new post overlay
const newPostOverlay = document.getElementById("NewPostOverlay"); // Button to close new post overlay

const newposttextarea = document.getElementById("new-post-text");
const newposttitlearea = document.getElementById("new-post-title");

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