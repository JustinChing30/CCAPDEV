const newPostBtn = document.getElementById("newPost"); // Button to open new post overlay
const newPostOverlay = document.getElementById("NewPostOverlay"); // Button to close new post overlay

const newposttextarea = document.getElementById("new-post-text");

const replyButtons = document.querySelectorAll(".reply-button");
const replyOverlay = document.getElementById("ReplyOverlay");
const newreplytextarea = document.getElementById("new-reply-text");

const closeButtons = document.querySelectorAll(".close-button");

// Open new post overlay
newPostBtn.addEventListener("click", () => {
  newPostOverlay.style.display = "flex";
  newposttextarea.value = '';
});

// Close new post overlay by clicking outside of the box
newPostOverlay.addEventListener("click", (e) => {
  if (e.target === newPostOverlay) {
    newPostOverlay.style.display = "none";
    newposttextarea.value = '';
  }
});

// Add listener to every single reply button
replyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    replyOverlay.style.display = "flex";
    newposttextarea.value = '';
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
    document.getElementById("new-reply-text").value = '';
  });
});