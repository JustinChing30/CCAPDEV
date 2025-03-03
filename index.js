const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
 
const app = express();
const hbs = require('hbs');
app.set('view engine','hbs');

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/blogDB')

/* For file uplods */
const fileUpload = require('express-fileupload')

/* Initialize our post */
const Post = require("./database/models/Post")
const path = require('path') // our path directory

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

app.use(cookieParser());

// insert authentication here

app.get("/", (req, res) => {
    console.log("Here!1");
    /* if (req.session.user) {
        const userData = req.session.user;
        res.render('homepage',{userData});
    }
    else{ */
        res.sendFile(__dirname + "/CCAPDEV/viewAllPosts.html");
    // }
});

app.get("/CCAPDEV/CCAPDEV/viewAllPosts", (req, res) => {
    console.log("Here!2");
    // res.sendFile()
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

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});