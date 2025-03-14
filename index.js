const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
 
const app = express();
const hbs = require('hbs');

// to compare post user to logged in user
hbs.registerHelper("equals", function (a, b) {
    return String(a) === String(b);
});

app.set('view engine','hbs');


const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/apdevDB');

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

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
    })
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

app.get("/logout", (req, res) => {
    // Destroy the session and redirect to the login page
    req.session.destroy(() => {
        res.clearCookie("sessionId");
        res.redirect("/");
    });
})

app.get("/viewAllPosts", isAuthenticated, async(req, res) => {
    const userData = req.session.user;
    // console.log(userData);

    const posts = await Post.find() // array of mongodb objects
    .populate("userID").lean(); // this .lean() is important to convert the posts to regular objects
    // BEFORE adding the liked: property to the object

    // console.log(posts);

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

// View Profile
app.get("/viewProfile", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    try {
        // Convert userID to ObjectId
        const postsBuffer = await Post.find({ userID: userData._id });

        const consolidatedData = {
            user: userData,
            posts: postsBuffer
        };

        res.render("viewProfile", { data: consolidatedData });

    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/viewProfile1", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    try {
        // console.log(mongoose.modelNames());
        const commentsBuffer = await Comment.find({commenterID: userData._id})
        .populate({
            path: "postID",
            populate: { path: "userID", select: "username"}
        })

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

app.get("/viewProfile2", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

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

        res.render("viewProfile2", { data: consolidatedData })
    }
    catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/editProfile", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    res.render("editProfile", {userData});

});

// View Specific Posts
app.get("/viewPost/:objectid", isAuthenticated, async(req, res) => { // objectid is a parameter here
    const { objectid } = req.params;

    const userData = req.session.user

    const requestedPost = await Post.findById(objectid).
    populate("userID").lean();
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

    res.render('Posts/post' + objectid, { data: consolidatedData });
});

// Create a Post
app.post("/create-post", isAuthenticated, async(req, res) => {
    const userData = req.session.user;
    const title = req.body.newPostTitle;
    const tag = req.body.newPostTag;
    const content = req.body.newPostText;
    let objectID = "";
    let fileContent = "";

    // Read template file
    const pathToFileTemplate = path.join(__dirname, 'postTemplateFile.txt');
    fs.readFile(pathToFileTemplate, function(err, data) {
        fileContent = data.toString('utf8');
    })

    await Post.create({
        title: title, // Title
        tag: tag, // The post tag (CCAPDEV, CCINFOM, etc.)
        content: content, // Post content
        userID: userData._id,
    })
        .then(result => {
            objectID = result._id.toString();
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

// Create a Comment
app.post("/createComment/:objectid", isAuthenticated, async(req, res) => {
    const userData = req.session.user;
    const { objectid } = req.params;
    const content = req.body.newReplyText;
    
    await Comment.create({
        content: content,
        commenterID: userData._id,
        postID: objectid
    })
        .then(comment => {
            console.log("Created comment: " + comment);
        })
        .catch(eerror => {
            console.error("Error creating comment:", error);
        })

    // console.log(objectid);

    const requestedPost = await Post.findById(objectid).
    populate("userID").lean();
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

    res.render('Posts/post' + objectid, { data: consolidatedData });
})

// profile viewing other users
app.get("/viewUserProfile/:userID", isAuthenticated, async (req, res) => {
    const userID = req.params.userID;
    const currentUser = req.session.user;

    const userData = await User.findById(userID); // Find user cause userID is just a string
    const postsBuffer = await Post.find({ userID: userID });

    const consolidatedData = {
        user: userData,
        posts: postsBuffer
    };

    if (userID === currentUser._id) {
        res.redirect("/viewProfile");
    }

    res.render("viewProfileNoEdit", { data: consolidatedData });
});

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

// Like a post
app.post("/like/:postId", isAuthenticated, async (req, res) => {
    const userData = req.session.user;

    const postId = req.params.postId;
    const userId = userData._id;

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

    const updatedPost = await Post.findById(postId); // gets the post
    const updatedLikeCount = updatedPost.likes.length; // gets the updated length

    return res.json({ liked: !hasLiked , likes: updatedLikeCount });
});

// Like a Comment
app.post("/likeComment/:commentId", isAuthenticated, async (req, res) => {
    const userData = req.session.user;

    const commentId = req.params.commentId;
    const userId = userData._id;

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

    const updatedComment = await Comment.findById(commentId); // gets the post
    const updatedLikeCount = updatedComment.likes.length; // gets the updated length

    return res.json({ liked: !hasLiked , likes: updatedLikeCount });

});

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

app.post("/updateFields", isAuthenticated, async(req, res) => {
    const userData = req.session.user; 

    const {bio, github, gender} = req.body

    const updatedUser = await User.findByIdAndUpdate(userData._id, {bio, github, gender}, {new: true});

    req.session.user = updatedUser.toObject();
    
    res.redirect("/viewProfile");
});

// Start the server

const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});