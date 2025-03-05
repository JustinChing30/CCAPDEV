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
const path = require('path') // our path directory

app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static('public')) // we'll add a static directory named "public"
app.use(fileUpload()) // for fileuploads

/***********End export *******************/

/* app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
    })
); */

// Insert details on users here

app.use(cookieParser());

// insert authentication here

app.get("/", async(req, res) => {
    const posts = await Post.find(); // array of mongodb objects
    const postsRender = posts.map(i => i.toObject()); // make it into normal js objects

    res.render('viewAllPosts',{posts: postsRender});
});

app.get("/viewallposts", (req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/viewAllPosts.html");
});

app.get("/viewprofile.html", (req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/viewprofile.html")
});

app.get("/viewprofile1.html", (req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/viewprofile1.html")
});

app.get("/viewprofile2.html", (req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/viewprofile2.html")
});

app.get("/editprofile.html", (req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/editprofile.html");
});

app.post("/create-post", async(req, res) => {
    const title = req.body.newPostTitle;
    const content = req.body.newPostText;
    let objectID = "";

    await Post.create({
        title: title, // Title
        tag: "CCAPDEV", // The post tag (CCAPDEV, CCINFOM, etc.)
        content: content, // Post content
        userID: 1
    })
        .then(result => {
            objectID = result._id.toString();
        })

    // write to a new file with the objectID set and place it in Posts folder
    const fileName = "post" + objectID + ".hbs";
    const pathToFile = path.join(__dirname, "/CCAPDEV/Posts",fileName);

    fs.appendFile(pathToFile, 'Content', function (err) {
        if (err) {
            throw err;
        }

        console.log("File created!");
    })

    res.redirect("/"); // sends it back to view all posts
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});