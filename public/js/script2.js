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
    newPostOverlay.style.display = "none";
    
    newposttextarea.value = '';
    newposttitlearea.value = '';
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
  
  // Method for clicking the like button (in viewallposts)
  document.body.addEventListener("click", async (event) => {
    if (event.target.classList.contains("like-button")) { // check if the element clicked in body is a like-button
      const button = event.target;
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
  })
  
})

document.getElementById("filter-dropdown").addEventListener("click", async function(event){
  const filteredPostsContainer = document.querySelector('.d-flex .flex-grow-1');
  const selected = event.target.textContent.trim();

  try{

    const filter = await axios.get(`/filter?q=${encodeURIComponent(selected)}`);

    const { filteredPost } = filter.data;

    if (filteredPost.length === 0) {
      filteredPostsContainer.innerHTML = '<div class="col-12 text-center p-5"><h4>No posts found matching your filter</h4></div>';
      return;
    }
    
    let filteredPostsHTML = '';
      filteredPost.forEach(post => {
        filteredPostsHTML += `
          <div class="col-12">
            <div class="border p-3 rounded-3 main-post">
              <h3 class="mb-1">
                <a href="viewPost/${post._id}" class="post-link">${post.title}</a>
              </h3>
              <span class="badge rounded-pill bg-success">${post.tag}</span>
              <div class="d-flex align-items-center">
                <div class="rounded-circle overflow-hidden pfp-comment">
                  <a href="/viewUserProfile/${post.userID._id}">
                    <img src="${post.userID.profilePic}">
                  </a>
                </div>
                <h5 class="comment-name">${post.userID.username}</h5>
              </div>
              <p class="p-comment">
                ${post.content}
              </p>
              <div class="d-flex justify-content-end">
                <button class="material-symbols-outlined like-button" data-post-id="${post._id}" data-liked="${post.liked}">thumb_up</button>
                <span class="like-count">${post.likes.length}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      filteredPostsContainer.innerHTML = filteredPostsHTML;
  }

  catch (error) {
    console.error('Error fetching filtered posts:', error);
    filteredPostsContainer.innerHTML = '<div class="col-12 text-center p-5"><h4>Error fetching filted posts. Please try again.</h4></div>';
  } 
})

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('mySearch');
  const searchBtn = document.getElementById('searchBtn');
  const postsContainer = document.querySelector('.d-flex .flex-grow-1');
  
  // Function to perform search
  const performSearch = async () => {
    const searchTerm = searchInput.value.trim();
    
    try {
      // Show loading state
      postsContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-success" role="status"></div><p class="mt-3">Searching...</p></div>';
      
      // Make the AJAX request using Axios
      let response;
      
      if (!searchTerm) {
        response = await axios.get(`/search`);

      }else{
        response = await axios.get(`/search?q=${encodeURIComponent(searchTerm)}`);

      }


      const { posts } = response.data;
      
      // If no results found
      if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="col-12 text-center p-5"><h4>No posts found matching your search</h4></div>';
        return;
      }
      
      // Generate HTML for the search results
      let postsHTML = '';
      posts.forEach(post => {
        postsHTML += `
          <div class="col-12">
            <div class="border p-3 rounded-3 main-post">
              <h3 class="mb-1">
                <a href="viewPost/${post._id}" class="post-link">${post.title}</a>
              </h3>
              <span class="badge rounded-pill bg-success">${post.tag}</span>
              <div class="d-flex align-items-center">
                <div class="rounded-circle overflow-hidden pfp-comment">
                  <a href="/viewUserProfile/${post.userID._id}">
                    <img src="/temp-images${post.userID.profilePic}">
                  </a>
                </div>
                <h5 class="comment-name">${post.userID.username}</h5>
              </div>
              <p class="p-comment">
                ${post.content}
              </p>
              <div class="d-flex justify-content-end">
                <button class="material-symbols-outlined like-button" data-post-id="${post._id}" data-liked="${post.liked}">thumb_up</button>
                <span class="like-count">${post.likes.length}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      postsContainer.innerHTML = postsHTML;
      
    } catch (error) {
      console.error('Error fetching search results:', error);
      postsContainer.innerHTML = '<div class="col-12 text-center p-5"><h4>Error fetching search results. Please try again.</h4></div>';
    }
  };
  // Add event listeners for search
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    performSearch();
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });
});
