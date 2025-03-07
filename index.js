const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
 
const app = express();
const hbs = require('hbs');
app.set('view engine','hbs');

const fs = require('fs');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/apdevDB');

/* For file uplods */
const fileUpload = require('express-fileupload')

/* Initialize our post */
const Post = require("./database/models/Post");
const Comment = require("./database/models/Comment");
const User = require("./database/models/User");
const path = require('path'); // our path directory

hbs.registerHelper("equal", function (a, b) {
    return a === b;
});

app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static('public')) // we'll add a static directory named "public"
app.use(fileUpload()) // for fileuploads

/***********End export *******************/

app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
    })
);

// Insert details on users here
/* const users = [{
    username: "Nate",
    password: "Admin",
    nickname: "Nathaniel",
    userID: 1
},
{
    username: "Justin",
    password: "Admin",
    nickname: "Jastin",
    userID: 2
} ,
{
    username: "Jed",
    password: "Admin",
    nickname: "Jedidayah",
    userID: 3
},
{
    username: "Steven",
    password: "Admin",
    nickname: "Tikoy",
    userID: 4
}] */

app.use(cookieParser());

// insert authentication here
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

app.get("/signUp", async(req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/signUp.html");
});

app.post("/signUp", express.urlencoded({ extended: true }), async(req, res) => {
    const { contact, pass, name, user } = req.body;

    // Validity checking of the inputs
    let validAccount = true;

    if (validAccount) {
        // Create a user
        const newUser = await User.create({
            name: name,
            username: user,
            password: pass,
            contact: contact,
            bio: "",
            profilePic: "" 
        })

        req.session.user = newUser.toObject();

        res.redirect("/");
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
    .populate("userID").lean();

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
        console.log(mongoose.modelNames());
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

app.get("/viewProfile2", isAuthenticated, (req, res) => {
    const userData = req.session.user;
    res.render("viewProfile2", { userData });
});

app.get("/editProfile", isAuthenticated, async(req, res) => {
    const userData = req.session.user;

    res.render("editProfile", {userData});

});

// View Specific Posts
app.post("/viewPost/:objectid", isAuthenticated, async(req, res) => { // objectid is a parameter here
    const { objectid } = req.params;

    const userData = req.session.user

    const requestedPost = await Post.findById(objectid).lean();
    const comments = await Comment.find({postID: objectid})
    .populate("commenterID");
    const commentsRender = comments.map(i => i.toObject());

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
    const content = req.body.newPostText;
    let objectID = "";
    let fileContent = "";

    // Read template file
    const pathToFileTemplate = path.join(__dirname, 'pt.txt');
    fs.readFile(pathToFileTemplate, function(err, data) {
        fileContent = data.toString('utf8');
    })

    function getRandomInt() {
        return Math.floor(Math.random() * 3); // Generates 0, 1, or 2
      }

    let randomizedTag = "";

    switch (getRandomInt()) {
        case 0:
            randomizedTag = "CCAPDEV";
            break;
        case 1:
            randomizedTag = "CCPROG1";
            break;
        case 2:
            randomizedTag = "CCINFOM";
            break;
    }

    await Post.create({
        title: title, // Title
        tag: randomizedTag, // The post tag (CCAPDEV, CCINFOM, etc.)
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

    console.log("fileContent: \n\n" + fileContent)
    fs.appendFileSync(pathToFile, fileContent, function (err) {
        if (err) {
            throw err;
        }

        console.log("File created!");
    })

    res.redirect("/"); // sends it back to view all posts
});

// Create a Comment
app.post("/createComment/:objectid", async(req, res) => {
    const userData = req.session.user;
    const { objectid } = req.params;
    const content = req.body.newReplyText;
    
    await Comment.create({
        content: content,
        commenterID: userData._id,
        postID: objectid
    })
    

    console.log(objectid);

    const requestedPost = await Post.findById(objectid).lean();
    const comments = await Comment.find({postID: objectid})
    .populate("commenterID");
    const commentsRender = comments.map(i => i.toObject());

    const consolidatedData = {
        post: requestedPost,
        comments: commentsRender,
        user: userData
    }

    res.render('Posts/post' + objectid, { data: consolidatedData });
})

// Like a post
app.post("/like/:postId", isAuthenticated, async (req, res) => {
    console.log("index.js");
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

        if (userData.profilePic && userData.profilePic !== "/default-avatar.png") {
            const oldImagePath = path.join(__dirname, "public", userData.profilePic);
            if (fs.existsSync(oldImagePath)) {
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