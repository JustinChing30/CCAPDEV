const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const axios = require("axios");


const app = express();
const hbs = require('hbs');

// to compare post user to logged in user
hbs.registerHelper("equals", function (a, b) {
    return String(a) === String(b);
});

app.set('view engine','hbs');


require("dotenv").config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to atlas"))
  .catch(err => console.error("Connection error:", err));

/* For file operations */
const fs = require('fs');

/* For file uploads */
const fileUpload = require('express-fileupload')

/* Initialize our post */
const Post = require("./database/models/Post");
const Comment = require("./database/models/Comment");
const User = require("./database/models/User");
const path = require('path'); // our path directory

app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static('public')) // Allows static files to be gathered from the 'public' directory
app.use(fileUpload()) // for fileuploads

/***********End export *******************/

console.log("Mongo URI:", process.env.MONGO_URI);

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            ttl: 14 * 24 * 60 * 60, // Session expiration (optional)
        }),})
);

// to get currently logged-in user stuff
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        res.locals.loggedInUser = req.session.user._id.toString(); // user id
        res.locals.loggedInUserData = req.session.user; // user data
    } else {
        res.locals.loggedInUser = null;
        res.locals.loggedInUserData = null;
    }
    next();
});

app.use(cookieParser());

// Authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

app.get("/", async(req, res) => {
    if (req.session.user) { // if they are logged into an account
        res.redirect("/viewAllPosts"); 
    }
    else {
        res.redirect("/login");
    }
});

/* Login method that directs to the login page if not already logged in.
Otherwise, it directs the user to viewAllPosts */
app.get("/login", (req, res) => {
    if (req.session.user) {
        res.redirect("/viewAllPosts");
        // console.log("if condition");
    }
    else{
        res.sendFile(__dirname + "/CCAPDEV/login.html");
        // console.log("else condition");
    }
})

/* Submitting a request to login with the encoded details */
app.post("/login", express.urlencoded({ extended: true }), async(req, res) => {
    const { username, password } = req.body;
    let accountFound = false;

    const users = await User.find().lean(); // list of users

    // Check if the provided credentials are valid
    for (let i = 0; i < users.length; i++) {
        if (username === users[i].username && password === users[i].password) {
            accountFound = true;
            req.session.user = users[i];
            res.cookie("sessionId", req.sessionID);

            res.redirect("/viewAllPosts");
        }
    }

    if (!accountFound) {
        res.redirect("/");
    }
})

/* Sign Up method that directs user to the sign up page */
app.get("/signUp", async(req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/signUp.html");
});

/* Submitting a request to sign up with the encoded details */
app.post("/signUp", express.urlencoded({ extended: true }), async(req, res) => {
    const { contact, pass, name, user, nickname } = req.body;

    const currentUsers = await User.find().lean();

    // Validity checking of the inputs
    let validAccount = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(contact) == false) {
        validAccount = false;
    }

    // check if encoded email and username is already being used
    currentUsers.forEach((existingUser) => {
        if (existingUser.username == user || existingUser.contact == contact) {
            validAccount = false;
        }
    })


    if (validAccount) {
        // Create a user
        const newUser = await User.create({
            name: name,
            username: user,
            password: pass,
            contact: contact,
            nickname: nickname, 
            bio: "",
        })

        req.session.user = newUser.toObject();

        res.redirect("/");
    }
    else {
        res.redirect("/signUp")
    }
})

/* Logging out of the current user */
app.get("/logout", (req, res) => {
    // Destroy the session and redirect to the login page
    req.session.destroy(() => {
        res.clearCookie("sessionId");
        res.redirect("/");
    });
})

/* Get method to view all the posts currently on the forum */
app.get("/viewAllPosts", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    // Select all posts
    const posts = await Post.find() // array of mongodb objects
    .populate("userID").lean(); // this .lean() is important to convert the posts to regular objects
    // BEFORE adding the liked: property to the object

    // While rendering the posts, automatically set the value of "liked", which rep. whether or not the current user has liked the post
    const postsRender = posts.map(post => ({
        ...post, 
        liked: post.likes.some(likeId => likeId.toString() === userData._id.toString())
    })); // make it into normal js objects
    // add a trait liked to the object to check if the current user has liked this post

    const consolidatedData = {
        user: userData,
        posts: postsRender
    }

    res.render('viewAllPosts',{ data: consolidatedData }); 
});

/* Get method to view one's own profile and the list of posts they have made */
app.get("/viewProfile", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    try {
        // Select all posts that were made by the current user
        const posts = await Post.find({ userID: userData._id }).lean();

        const consolidatedData = {
            user: userData,
            posts: posts
        };

        res.render("viewProfile", { data: consolidatedData });
    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).send("Internal Server Error");
    }
});

/* Get method to view one's own profile and the list of comments they have made */
app.get("/viewProfile1", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    try {
        // Select all comments that were made by the current user
        const commentsBuffer = await Comment.find({commenterID: userData._id})
        .populate({
            path: "postID",
            populate: { path: "userID", select: "username"}
        }).lean();

        const consolidatedData = {
            user: userData,
            comments: commentsBuffer
        }

        res.render("viewProfile1", { data: consolidatedData });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send("Internal Server Error");
    }
});

/* Get method to view one's own profile and the list of posts and comments they have liked */
app.get("/viewProfile2", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    try {
        // Select all posts that were liked by the user
        const likedPosts = await Post.find({likes: userData._id})
        .populate("userID").lean();
        
        // Select all comments that were liked by the user
        const likedComments = await Comment.find({likes: userData._id})
        .populate("postID").lean();
        
        // NOTE: the likes: userData._id checks if the current user's objectID is in the list of users that have liked the post/comment

        const consolidatedData = {
            user: userData,
            posts: likedPosts,
            comments: likedComments
        }

        res.render("viewProfile2", { data: consolidatedData })
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send("Internal Server Error");
    }
});

/* Get method to edit one's own profile*/
app.get("/editProfile", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    res.render("editProfile", {userData});
});

/* Get method to view a specific post. The :objectid is a parameter that directs the user to the clicked post */
app.get("/viewPost/:objectid", isAuthenticated, async(req, res) => { // objectid is a parameter here
    const { objectid } = req.params;

    const userData = req.session.user

    // Select the post being viewed
    const requestedPost = await Post.findById(objectid).
    populate("userID").lean();

    const requestedPostRender = {
        ...requestedPost,
        liked: requestedPost.likes.some(likeId => likeId.toString() === userData._id.toString())
    }

    // Select the comments of the post being viewed
    const comments = await Comment.find({postID: objectid})
    .populate("commenterID").lean(); // this .lean() is important to convert the posts to regular objects
    // BEFORE adding the liked: property to the object

    /* While rendering the comments, automatically set the value of "liked", which rep. whether or not 
    the current user has liked the comment */
    const commentsRender = comments.map(comment => ({
        ...comment,
        liked: comment.likes.some(likeId => likeId.toString() === userData._id.toString())
    }));

    const consolidatedData = {
        post: requestedPostRender,
        comments: commentsRender,
        user: userData
    }

    res.render('Posts/post' + objectid, { data: consolidatedData });
});

/* Post method to create a post */
app.post("/create-post", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    // Gather post details
    const title = req.body.newPostTitle;
    const tag = req.body.newPostTag;
    const content = req.body.newPostText;

    // Details for file creation
    let objectID = "";
    let fileContent = "";

    // Read post template file
    const pathToFileTemplate = path.join(__dirname, 'postTemplateFile.txt');
    fs.readFile(pathToFileTemplate, function(err, data) {
        fileContent = data.toString('utf8');
    })

    // Create the post and add it to the post database
    await Post.create({
        title: title, 
        tag: tag, 
        content: content, 
        userID: userData._id,
    })
        .then(result => {
            objectID = result._id.toString(); // save the objecid of the created post
        })
        /* .then works here because Post.create() returns a Promise, which is an asynch operation
        .then is used to handle the resolved value of a promise
        Post.create resolves to the created post object, so you can chain .then to it */

    // write to a new file with the objectID set and place it in Posts folder
    const fileName = "post" + objectID + ".hbs";
    const pathToFile = path.join(__dirname, "/views/Posts",fileName);

    // console.log("fileContent: \n\n" + fileContent)
    fs.appendFileSync(pathToFile, fileContent, function (err) {
        if (err) {
            throw err;
        }

        console.log("File created!");
    })

    res.redirect("/"); // sends it back to view all posts
});

/* Get method to create a comment on the specified post. The objectid parameter here represents the post being replied to */
app.post("/createComment/:objectid", isAuthenticated, async(req, res) => {
    const userData = req.session.user;
    const { objectid } = req.params;

    // Gather comment content
    const content = req.body.newReplyText;
    
    // Create the comment and add it to the comment database
    await Comment.create({
        content: content,
        commenterID: userData._id,
        postID: objectid
    })
        .then(comment => {
            // console.log("Created comment: " + comment);
        })
        .catch(error => {
            console.error("Error creating comment:", error);
        })

    // Select the post being replied to
    const requestedPost = await Post.findById(objectid).
    populate("userID").lean();

    // Select the list of comments replying to the post the user is looking to reply to
    const comments = await Comment.find({postID: objectid})
    .populate("commenterID").lean(); // this .lean() is important to convert the posts to regular objects
    // BEFORE adding the liked: property to the object
    
    // While rendering the comments, automatically set the value of "liked", which rep. whether or not the current user has liked the comment
    const commentsRender = comments.map(comment => ({
        ...comment,
        liked: comment.likes.some(likeId => likeId.toString() === userData._id.toString())
    }));

    const consolidatedData = {
        post: requestedPost,
        comments: commentsRender,
        user: userData
    }

    // Re-render the post, but with the new comment just created
    res.render('Posts/post' + objectid, { data: consolidatedData });
})

/* Get method to view someone else's profile and the list of posts they have made. The userID parameter here represents the objectid of
the user that the current user wants to view */
app.get("/viewUserProfile/:userID", isAuthenticated, async (req, res) => {
    const userID = req.params.userID;
    const currentUser = req.session.user;

    // Select the data of the user to be viewed
    const userData = await User.findById(userID);

    // Select the posts made by the user to be viewed
    const postsBuffer = await Post.find({ userID: userID });

    const consolidatedData = {
        user: userData,
        posts: postsBuffer
    };

    // In case a user clicks their own profile from a post, redirect them to view their own profile
    if (userID === currentUser._id) {
        res.redirect("/viewProfile");
    }

    // Otherwise, redirect the user to the specified person's profile
    res.render("viewProfileNoEdit", { data: consolidatedData });
});

/* Get method to view someone else's profile and the list of comments they have made. The userID parameter here represents the objectid of
the user that the current user wants to view */
app.get("/viewUserProfile1/:userID", isAuthenticated, async(req, res) => {
    const commenterID = req.params.userID;

    const userData = await User.findById(commenterID); // Find user cause userID is just a string

    try {
        // console.log(mongoose.modelNames());
        const commentsBuffer = await Comment.find({commenterID: commenterID})
        .populate({
            path: "postID",
            populate: { path: "userID", select: "username"}
        })

        const consolidatedData = {
            user: userData,
            comments: commentsBuffer
        }

        res.render("viewProfile1NoEdit", { data: consolidatedData });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send("Internal Server Error");
    }
});

/* Get method to view someone else's profile and the list of posts and comments they have liked. The userID parameter here represents 
the objectid of the user that the current user wants to view */
app.get("/viewUserProfile2/:userID", isAuthenticated, async(req, res) => {
    const userID = req.params.userID;

    const userData = await User.findById(userID);

    try {
        const likedPosts = await Post.find({likes: userData._id})
        .populate("userID").lean();
        const likedComments = await Comment.find({likes: userData._id})
        .populate("postID").lean();

        const consolidatedData = {
            user: userData,
            posts: likedPosts,
            comments: likedComments
        }

        res.render("viewProfile2NoEdit", { data: consolidatedData })
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send("Internal Server Error");
    }
});

/* Post method to like a specified post. The postId parameter here represents the post to be liked. */
app.post("/like/:postId", isAuthenticated, async (req, res) => {
    const userData = req.session.user;
    const userId = userData._id;

    // Gather details of the post to be liked
    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    const hasLiked = post.likes.some((id) => id.equals(userId)); // check if logged user already liked that post
    // the .some() is an array method that returns true if the id is in the array of likes, i.e. the user has liked it
    // the (id) variable is like an index (kunwari int i = 0; i < likes.size; i++) that goes through each user that has liked the
    // post and does the id.equals method to the userId

    // Toggle like
    if (hasLiked) {
        await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
    } else {
        await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } });
    }

    // Select the updated post and the new like count
    const updatedPost = await Post.findById(postId); 
    const updatedLikeCount = updatedPost.likes.length;

    // Send a json request back to whatever page the user is on that the post has been liked
    return res.json({ liked: !hasLiked , likes: updatedLikeCount });
});

/* Post method to like a specified comment. The commentId parameter here represents the comment to be liked. */
app.post("/likeComment/:commentId", isAuthenticated, async (req, res) => {
    const userData = req.session.user;
    const userId = userData._id;

    // Gather details of the comment to be liked
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);

    if (!comment) {
        return res.status(404).json({ message: "Post not found" });
    }

    const hasLiked = comment.likes.some((id) => id.equals(userId)); // check if logged user already liked that post
    // the .some() is an array method that returns true if the id is in the array of likes, i.e. the user has liked it
    // the (id) variable is like an index (kunwari int i = 0; i < likes.size; i++) that goes through each user that has liked the
    // post and does the id.equals method to the userId

    // Toggle like
    if (hasLiked) {
        await Comment.findByIdAndUpdate(commentId, { $pull: { likes: userId } });
    } else {
        await Comment.findByIdAndUpdate(commentId, { $addToSet: { likes: userId } });
    }

    // Select the updated post and the new like count    
    const updatedComment = await Comment.findById(commentId); 
    const updatedLikeCount = updatedComment.likes.length;

    // Send a json request back to whatever page the user is on that the comment has been liked
    return res.json({ liked: !hasLiked , likes: updatedLikeCount });
});

/* Post method to change the current user's profile picture in edit profile */
app.post("/changeProfileImage", isAuthenticated, async (req, res) => {
    const userData = req.session.user; 

    if (!req.files || !req.files.profilePic){
        return res.status(400).send("No image uploaded");
    }

    const profilePic = req.files.profilePic;
    const imageName = `profile_${userData._id}${path.extname(profilePic.name)}`;
    const imagePath = path.join(__dirname, 'public/images', imageName);

    try {
        if (!fs.existsSync(path.join(__dirname, "public/images"))) {
            fs.mkdirSync(path.join(__dirname, "public/images"), { recursive: true });
        }

        if (userData.profilePic && userData.profilePic !== "/defaultImage.png") {
            const oldImagePath = path.join(__dirname, "public", userData.profilePic);
            if (fs.existsSync(oldImagePath) && !oldImagePath.includes("defaultImage.png")) {
                fs.unlinkSync(oldImagePath);
            }
        }

        await profilePic.mv(imagePath);

        await User.findByIdAndUpdate(userData._id, { profilePic: `/images/${imageName}` });

        req.session.user.profilePic = `/images/${imageName}`;

        res.redirect("/editProfile");
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).send("Error uploading profile picture.");
    }
});

/* Post method to update the details of the current user in edit profile */
app.post("/updateFields", isAuthenticated, async(req, res) => {
    const userData = req.session.user; 

    const {bio, github, gender} = req.body

    const updatedUser = await User.findByIdAndUpdate(userData._id, {bio, github, gender}, {new: true});

    req.session.user = updatedUser.toObject();
    
    res.redirect("/viewProfile");
});

app.get("/search", isAuthenticated, async(req, res) => {
    try {
      const searchQuery = req.query.q;
      const userData = req.session.user;
      
      if (!searchQuery) {
        return res.json({ posts: [] });
      }
      
      // Create a regex for case-insensitive search
      const searchRegex = new RegExp(searchQuery || ".*", 'i');
      
      // Search in multiple fields: title, content, and tags
      const posts = await Post.find({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tag: searchRegex }
        ]
      })
      .populate("userID")
      .lean();
      
     
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Error performing search" });
    }
  });

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});