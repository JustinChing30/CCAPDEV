const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
 
const app = express();
const hbs = require('hbs');
app.set('view engine','hbs');

/*
From our "All-in-one backend kit"
*/

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

const user1 = {
    name: "Art",
    quote: "Hello! I'm Art!",
    userID: 1
}; 

const user2 = {
    name: "Charlie",
    quote: "Arf! Arf! Woof! Woof!",
    userID: 2
}; 

app.use(cookieParser());
 
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};
 
app.get("/", (req, res) => {
    if (req.session.user) {
        const userData = req.session.user;
        res.render('homepage',{userData});
    }
    else{
        res.sendFile(__dirname + "/index.html");
    }
});
 
app.get("/login", (req, res) => {
    if (req.session.user) {
        res.redirect("/profile");
    }
    else{
    res.sendFile(__dirname + "/login.html");
    }
});
 
app.post("/login", express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
 
    // Check if the provided credentials are valid
    if (username === "admin" && password === "admin") {
        // Store user data in the session
        req.session.user = user1;
        res.cookie("sessionId", req.sessionID);
 
        res.redirect("/profile");
    }
    else if (username === "charlie" && password === "charlie") {
        // Store user data in the session
        req.session.user = user2;
        res.cookie("sessionId", req.sessionID);
 
        res.redirect("/profile");
    }
     else {
        res.send("Invalid credentials. <a href='/login'>Please try again.");
    }
});
 
app.get("/profile", isAuthenticated, (req, res) => {
    // Retrieve user data from the session
    const userData = req.session.user;
    console.log(userData);
    res.render('profile',{userData});
});
 
app.get("/logout", (req, res) => {
    // Destroy the session and redirect to the login page
    req.session.destroy(() => {
        res.clearCookie("sessionId");
        res.redirect("/");
    });
});

app.get('/create-post', isAuthenticated, function (req, res) {
    const userData = req.session.user;
    res.render('create',{userData});
});

/* Copied from the all-in-one-backend kit */
app.post('/submit-post', isAuthenticated, function(req, res) {
    const userData = req.session.user;
    const {image} = req.files
    image.mv(path.resolve(__dirname,'public/images',image.name),(error) => {
        if (error)
        {
            console.log ("Error!")
        }
        else
        {
        Post.create({
        ...req.body,
        image:'/images/'+image.name,
        userID: userData.userID
        });

        res.redirect('/view-post');
        }
    })
});

app.get('/view-post', isAuthenticated,async(req,res) => {
    const userData = req.session.user;
    const posts = await Post.find({userID:userData.userID}) // select * from Post where userID == userData.userID
    console.log(posts)
    res.render('content',{posts})
})

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});