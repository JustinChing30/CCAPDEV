const postsButton = document.getElementById("postsBtn");
const commentsButton = document.getElementById("commentsBtn");
const likeButton = document.getElementById("likesBtn");

const divPosts = document.querySelector(".div-posts");
const divComments = document.querySelector(".div-comments");
const divLikes = document.querySelector(".div-likes");

console.log(postsButton);
console.log(divPosts);

const originalPost = divPosts.innerHTML;

divPosts.addEventListener("click", () => {
    divPosts.style.display = "flex";
    divComments.style.display = "none";
    divLikes.style.display = "none";

    divPosts.innerHTML = originalPost;

});

commentsButton.addEventListener("click", () => {

    divPosts.style.display = "none";
    divComments.style.display = "flex";
    divLikes.style.display = "none";

    divComments.innerHTML = "";

    let commentDiv = document.createElement("div");
    commentDiv.style.display = "flex"

    commentDiv.innerHTML = "<p> Hello </p>";

    divComments.appendChild(commentDiv);
});

likeButton.addEventListener("click", () => {
    divPosts.style.display = "none";
    divComments.style.display = "none";
    divLikes.style.display = "block";

    divLikes.innerHTML = "";
});



