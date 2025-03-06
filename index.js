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
const path = require('path'); // our path directory
const User = require("./database/models/User");

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
const users = [{
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
}]

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

app.post("/login", express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    let accountFound = false;

    // Check if the provided credentials are valid
    for (let i = 0; i < users.length; i++) {
        if (username === users[i].username && password === "Admin") {
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

app.get("/viewAllPosts", isAuthenticated, async(req, res) => {
    const userData = req.session.user;
    console.log(userData);

    const posts = await Post.find(); // array of mongodb objects
    const postsRender = posts.map(i => i.toObject()); // make it into normal js objects

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
        const postsBuffer = await Post.find({ userID: new mongoose.Types.ObjectId(userData.userID) });

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
        const commentsBuffer = await Comment.find({ commenterID: new mongoose.Types.ObjectId(userData.userID) });

        const consolidatedData = {
            user: userData,
            posts: commentsBuffer
        };

        res.render("viewProfile1", { data: consolidatedData });

    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).send("Internal Server Error");
    }
});

// View Profile 2 (Basic Info)
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

    const requestedPost = await Post.findById(objectid).lean(); // .lean() converts mongoose document into plain JS object
    const comments = await Comment.find({postID: objectid}); // only pass comments associated with this post
    const commentsRender = comments.map(i => i.toObject()); // convert all comments to JS objects

    const consolidatedData = {
        postTitle: requestedPost.title,
        postTag: requestedPost.tag,
        postContent: requestedPost.content,
        comments: commentsRender,
        postID: requestedPost._id,
        postUsername: requestedPost.username,
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
        userID: userData.userID,
        username: userData.username
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
    fs.appendFile(pathToFile, fileContent, function (err) {
        if (err) {
            throw err;
        }

        console.log("File created!");
    })

    res.redirect("/"); // sends it back to view all posts
});

// Create a Comment
app.post("/createComment/:objectid", async(req, res) => {
    const { objectid } = req.params;
    const content = req.body.newReplyText;
    
    await Comment.create({
        content: content,
        userID: 2,
        username: "CommentMaker"
    })
    

    console.log(objectid);

    const requestedPost = await Post.findById(objectid).lean();
    const comments = await Comment.find();
    const commentsRender = comments.map(i => i.toObject());

    const consolidatedData = {
        postTitle: requestedPost.title,
        postTag: requestedPost.tag,
        postContent: requestedPost.content,
        comments: commentsRender,
        postID: requestedPost._id
    }

    res.render('Posts/post' + objectid, { data: consolidatedData });
})

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});