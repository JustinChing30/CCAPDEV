document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".moreOptionsButton").forEach(button => {
      button.addEventListener("click", function (event) {
          event.stopPropagation();

          let dropdown = this.nextElementSibling;
          let isVisible = dropdown.style.display === "block";

          document.querySelectorAll(".options-dropdown, .options-dropdown-comment").forEach(menu => {
              menu.style.display = "none";
          });

          dropdown.style.display = isVisible ? "none" : "block";
      });
  });

  document.addEventListener("click", function () {
      document.querySelectorAll(".options-dropdown, .options-dropdown-comment").forEach(menu => {
          menu.style.display = "none";
      });
  });
});


const profileButton = document.getElementById("profileDropdownBtn"); // Button to open dropdown
const profileDropdown = document.getElementById("profileDropdown"); // The actual dropdown

const replyButtons = document.querySelectorAll(".reply-button");
const replyOverlay = document.getElementById("ReplyOverlay");
const newreplytextarea = document.getElementById("newReplyText");

const closeButtons = document.querySelectorAll(".close-button");

const moreOptionsButton = document.querySelectorAll(".moreOptionsButton") // Buttons to open triple dot dropdown
const moreOptionsDropdownComment = document.querySelectorAll(".options-dropdown-comment") // All the actual overlays for triple dot dropdown

const editPostBtn = document.getElementById("editPost"); // Button to open new post overlay
const editPostOverlay = document.getElementById("EditPostOverlay"); // Button to close new post overlay

const editReplyButtons = document.querySelectorAll(".edit-comment-button");
const editReplyOverlay = document.getElementById("EditReplyOverlay");
const editreplytextarea = document.getElementById("editReplyText");
const editReplyForm = document.getElementById("editCommentForm");

const editposttextarea = document.getElementById("editPostText");
const editposttitlearea = document.getElementById("editPostTitle");
const editpostdropdownbox = document.getElementById("editPostTag");

// Add listener to every single reply button
replyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    console.log("Reply Button clicked");
    replyOverlay.style.display = "flex";

    newreplytextarea.value = '';

    const username = button.getAttribute("data-username");

    if (username) { // if username is not null
      newreplytextarea.value = `@${username} `;
    }

  });
});

// Close reply overlay by clicking outside of the box
replyOverlay.addEventListener("click", (e) => {
  if (e.target === replyOverlay) {
    replyOverlay.style.display = "none";
    newreplytextarea.value = '';
  }
});

// Add listener to every single edit reply button
editReplyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    console.log("Here!");
    const commentID = button.getAttribute("data-comment-id");

    console.log(editReplyOverlay);
    editReplyOverlay.style.display = "flex";

    // get current reply content
    const commentPElement = document.querySelector(`.p-commentContent[data-comment-id="${commentID}"]`);    
    console.log("commentPElement: " + commentPElement);
    const commentContentText = commentPElement.textContent

    console.log("commentContentText: " + commentContentText);

    editreplytextarea.value = commentContentText; // make this into current reply content

    // Set the data-comment-id of editReplyForm to the id
    editReplyForm.setAttribute("data-comment-id", commentID)
  });
});

editReplyForm.addEventListener("submit", function(event) {
  // Grab text
  const newCommentContent = editreplytextarea.value;
  const commentID = editReplyForm.getAttribute("data-comment-id");

  // Send request to index.js for them to edit the comment app.post("/edit-comment/:commentID"

  // Send a POST request to the server with the new comment content and comment ID
  fetch(`/edit-comment/${commentID}`, {
    method: "POST", // HTTP method
    headers: {
        "Content-Type": "application/json" // Sending JSON data
    },
    body: JSON.stringify({
        content: newCommentContent, // New content for the comment
    })
  })
  .then(response => response.json()) // Parse the response as JSON
  .then(data => {
      // Handle the response from the server (e.g., show a success message)
      console.log("Server response:", data);
  })
  .catch(error => {
      // Handle any errors that occur during the fetch request
      console.error("Error:", error);
  });
})

// Close reply overlay by clicking outside of the box
editReplyOverlay.addEventListener("click", (e) => {
  if (e.target === editReplyOverlay) {
    editReplyOverlay.style.display = "none";
    editreplytextarea.value = '';
    editReplyForm.setAttribute("data-comment-id", "")
  }
});

// Add listener to every both post and reply overlay close button so they do the same thing
closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    replyOverlay.style.display = "none";
    editPostOverlay.style.display = "none";
    editReplyOverlay.style.display = "none";
    
    newreplytextarea.value = '';
    editposttitlearea.value = '';
    editposttextarea.value = '';
    editreplytextarea.value = '';
    editReplyForm.setAttribute("data-comment-id", "")
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
      
      // Check if the button being clicked is a comment like button
      if (button.hasAttribute("data-comment-id")) {
        const commentId = button.getAttribute("data-comment-id");
        // console.log("fetched data: " + button.getAttribute("data-liked"));
        const isLiked = button.getAttribute("data-liked") === "true";
  
        console.log("commentId: " + commentId);
  
        try {
          // Sends a request to the /likeComment/${commentId} method that contains the boolean value of liked in the clicked like button
          const response = await fetch(`/likeComment/${commentId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ liked: !isLiked })
          });
      
          // This data represents the sent json request data from this post method (for reference: return res.json({ liked: !hasLiked , likes: updatedLikeCount });)
          const data = await response.json();
  
          // Set the attributes of the button properly
          console.log("Setting attributes...");
          button.setAttribute("data-liked", !isLiked);
    
          button.classList.toggle("liked", !isLiked);
  
          const likeCount = button.nextElementSibling; // referring to the like-count span group right beside/below the like button
          likeCount.textContent = data.likes; // changes like counter
  
        } catch (error) {
          console.error("Error toggling like:", error);
        }
      }
      else { // For clicking the liked button in the main post
        // console.log("fetched data: " + button.getAttribute("data-liked"));
        const isLiked = button.getAttribute("data-liked") === "true";
        const postId = button.getAttribute("data-post-id");

        try {
          // Sends a request to the /like/${postId} method that contains the boolean value of liked in the clicked like button
          const response = await fetch(`/like/${postId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ liked: !isLiked })
          });
      
          // This data represents the sent json request data from this post method (for reference: return res.json({ liked: !hasLiked , likes: updatedLikeCount });)
          const data = await response.json();

          // Set the attributes of the button properly
          console.log("Setting attributes...");
          button.setAttribute("data-liked", !isLiked);
    
          button.classList.toggle("liked", !isLiked);

          const likeCount = button.nextElementSibling; // referring to the like-count span group right beside/below the like button
          likeCount.textContent = data.likes; // changes like counter

        } catch (error) {
          console.error("Error toggling like:", error);
        }
      }
    }
  })
})

// Open edit post overlay
editPostBtn.addEventListener("click", () => {
  console.log("Here!");
  editPostOverlay.style.display = "flex";
  
  // get current text and title of post
  const pContent = document.querySelector('.p-postContent');
  const pContentText = pContent.textContent.trim();

  const h3Title = document.querySelector('.mb-1')
  const h3TitleText = h3Title.textContent.trim();

  const tagValue = document.querySelector('.badge') //               <span class="badge rounded-pill bg-success">{{data.post.tag}}</span>
  var tagValueText = tagValue.textContent.trim();

  editposttextarea.value = pContentText; // content: <p class="p-comment">{{data.post.content}}</p>
  editposttitlearea.value = h3TitleText; // title:                   <h3 class="mb-1"><b>{{data.post.title}}</b></h3>
  editpostdropdownbox.value = tagValueText;
});

// Close edit post overlay by clicking outside of the box
editPostOverlay.addEventListener("click", (e) => {
  if (e.target === editPostOverlay) {
    editPostOverlay.style.display = "none";
    editposttextarea.value = '';
    editposttitlearea.value = '';
  }
});