const newPostBtn = document.getElementById("newPost");
const newPostOverlay = document.getElementById("NewPostOverlay");
const closeBtn = document.getElementById("close");
const newposttextarea = document.getElementById("new-post-text");

// Open new post overlay
newPostBtn.addEventListener("click", () => {
  newPostOverlay.style.display = "flex";
  newposttextarea.value = '';
});

// Close new post overlay
closeBtn.addEventListener("click", () => {
  newPostOverlay.style.display = "none";
  newposttextarea.value = '';
});

// Close new post overlay by clicking outside of the box
newPostOverlay.addEventListener("click", (e) => {
  if (e.target === newPostOverlay) {
    newPostOverlay.style.display = "none";
    newposttextarea.value = '';
  }
});