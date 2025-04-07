const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const axios = require("axios");
var passport = require('passport')
var crypto = require('crypto')
var LocalStrategy = require('passport-local').Strategy;

// LATEST COMMIT 04/07 9:41PM

const app = express();
const hbs = require('hbs');

// to compare post user to logged in user
hbs.registerHelper("equals", function (a, b) {
    return String(a) === String(b);
});

hbs.registerHelper('log', function(context) {
    console.log(context);
    return ''; // Return an empty string to prevent this from rendering in the HTML
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

/* app.set('views', path.join(__dirname, 'tmp'));  // Change 'tmp' to your desired path
 */
app.use(express.json()) // use json
app.use(express.urlencoded( {extended: true})); // files consist of more than strings
app.use(express.static('public')) // Allows static files to be gathered from the 'public' directory
app.use(fileUpload()) // for fileuploads
app.use('/temp-images', express.static('/tmp/images'));

/***********End export *******************/

console.log("Mongo URI:", process.env.MONGO_URI);

passport.use(new LocalStrategy(
    function(username, password, cb) { // cb here stands for callbac
        User.findOne({ username: username })
            .then((user) => {

                if (!user) { return cb(null, false) }
                
                // Function defined at bottom of app.js
                const isValid = validPassword(password, user.hash, user.salt);
                
                // If the If validPassword = true, authentication was successful
                if (isValid) {
                    return cb(null, user); // pass the user object to Passport
                } else {
                    return cb(null, false);
                }
            })
            .catch((err) => {   
                cb(err);
            });
}));

// Serialize user object and add it to req.session.passport object (this only saves the userID to req.session.passport)
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

// Called on every authenticated request & retrieves full user object from DB using the stored user ID in session
passport.deserializeUser(async function(id, cb) {
    try {
        const user = await User.findById(id);  // Use await for asynchronous call
        cb(null, user);  // Once user is found, pass the user object to callback
    } catch (err) {
        cb(err);  // Handle error if something goes wrong
    }
});

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

app.use(passport.initialize()); // middleware to check for existing req.session.passport data & grabbing userID to save in internal passport
app.use(passport.session()); // grabs saved userID in internal passport and returns user object w/ deserializeUser
app.use(cookieParser());

// Authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

// On start up, create a folder images in /tmp and add the defaultImage file
const imageDestination = '/tmp/images';
const defaultImageFilePath = path.join(imageDestination, 'defaultImage.png')

// Create /tmp/images directory if it doesn't exist
if (!fs.existsSync(tmpImagesDir)) {
    fs.mkdirSync(tmpImagesDir, { recursive: true });
    console.log('✅ Created /tmp/images folder');
} else {
    console.log('/tmp/images folder already exists');
}

// Create a placeholder file (or any default image/file)
const imageSource = path.join(__dirname, '/public/images/defaultImage.png')
fs.copyFileSync(imageSource, imageDestination);
console.log('Added default image at ' + defaultImageFilePath);

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

/* Method to direct the user to the viewAllPosts if login was successful or to the error screen if the login was unsuccessful */
app.post('/login', passport.authenticate('local', { failureRedirect: '/login-failure', successRedirect: 'login-success' }), (err, req, res, next) => {
    if (err) next(err);
});

app.get('/login-success', async (req, res, next) => {
    const userId = req.session.passport.user;
    console.log("Current user id: " + req.session.passport);
    
    try {
        const user = await User.findById(userId);
        req.session.user = user;
        res.cookie("sessionID", req.sessionID);
        res.redirect("/viewAllPosts");
    } catch (error) {
        console.error(error);
        // Handle the error (for example, redirecting the user)
    };
});

app.get('/login-failure', (req, res, next) => {
    return res.redirect("/login?error=Incorrect+username+or+password");
});

/* Sign Up method that directs user to the sign up page */
app.get("/signUp", async(req, res) => {
    res.sendFile(__dirname + "/CCAPDEV/signUp.html");
});

app.get("/about", async(req, res) =>{
    res.sendFile(__dirname + "/CCAPDEV/about.html");
})

/* Submitting a request to sign up with the encoded details */
app.post("/signUp", async(req, res, next) => {
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

    const saltHash = genPassword(pass);
    
    const salt = saltHash.salt;
    const hash = saltHash.hash;

    if (validAccount) {
        // Create a user
        const newUser = await User.create({
            name: name,
            username: user,
            hash: hash,
            salt: salt,
            contact: contact,
            nickname: nickname, 
            bio: "",
        })

        req.session.user = newUser.toObject();

        res.redirect("/");
    }
    else {
        res.redirect("/signUp?error=Email+or+Username+already+exists");
    }
})

/* Logging out of the current user */
app.get("/logout", (req, res) => {
    // Destroy the session and redirect to the login page
    req.logout((err) => {
        if (err) {
            return res.status(500).send("Logout Error");
        }
        req.session.destroy(() => {
            res.clearCookie("sessionId");
            res.redirect("/");
        });
    })
})

/**
 * 
 * @param {*} password - The plain text password
 * @param {*} hash - The hash stored in the database
 * @param {*} salt - The salt stored in the database
 * 
 * This function uses the crypto library to decrypt the hash using the salt and then compares
 * the decrypted hash/salt with the password that the user provided at login
 */
function validPassword(password, hash, salt) {
    var hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === hashVerify;
}

/**
 * 
 * @param {*} password - The password string that the user inputs to the password field in the register form
 * 
 * This function takes a plain text password and creates a salt and hash out of it.  Instead of storing the plaintext
 * password in the database, the salt and hash are stored for security
 * 
 * ALTERNATIVE: It would also be acceptable to just use a hashing algorithm to make a hash of the plain text password.
 * You would then store the hashed password in the database and then re-hash it to verify later (similar to what we do here)
 */
function genPassword(password) {
    var salt = crypto.randomBytes(32).toString('hex');
    var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    
    return {
      salt: salt,
      hash: genHash
    };
}

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
    console.log(objectid);


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

    // console.log("commentsRender:" + commentsRender);

    const consolidatedData = {
        post: requestedPostRender,
        comments: commentsRender,
        user: userData
    }

    console.log("Comment length: " + commentsRender.length);

    console.log(consolidatedData);

    res.render("postTemplate", { data: consolidatedData });
});

/* Post method to create a post */
app.post("/create-post", isAuthenticated, async (req, res) => {
    const userData = req.session.user;

    // Gather post details
    const title = req.body.newPostTitle;
    const tag = req.body.newPostTag;
    const content = req.body.newPostText;

   /*  // Details for file creation
    let objectID = "";
    let fileContent = "";

    // Read post template file
    const pathToFileTemplate = path.join(__dirname, 'postTemplateFile.txt');
    fileContent = fs.readFileSync(pathToFileTemplate, "utf8"); */

    // Create the post and add it to the post database
    await Post.create({
        title: title, 
        tag: tag, 
        content: content, 
        userID: userData._id,
    }).then(result => {
        objectID = result._id.toString(); // save the objectid of the created post
    });

    /* // Write to a new file with the objectID set and place it in /tmp
    const fileName = "post" + objectID + ".hbs";
    const pathToFile = path.join("/tmp", fileName);  // Write to /tmp instead
    fs.appendFileSync(pathToFile, fileContent); */

    res.redirect("/"); // Redirect back to view all posts
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

    res.redirect(`/viewPost/${objectid}`);
})

app.post("/edit-post/:postID", isAuthenticated, async (req, res) => {
    const { postID } = req.params;

    // Gather edited post details
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const newTitle = req.body.editPostTitle;
    const newTag = req.body.editPostTag;
    const newContent = req.body.editPostText;

    // console.log("postID: " + postID);

    console.log("New title:", newTitle, "New tag:", newTag, "New content:", newContent);

    // Select the post and edit it
    const editedPost = await Post.findByIdAndUpdate(
        postID, 
        { 
            title: newTitle, // Use an object with key-value pairs
            tag: newTag,
            content: newContent 
        },
        { 
            new: true, // Return the updated document
            runValidators: true // Ensure schema validation
        }
    ).
    populate("userID");

    const editedPostData = editedPost._doc

    console.log("Edited post: " + editedPostData);

    res.redirect(`/viewPost/${postID}`);
})

app.post("/edit-comment/:commentID", isAuthenticated, async (req, res) => {
    const { commentID } = req.params;

    // Gather edited post details
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const newContent = req.body.content;

    console.log("New content: ", newContent);

    // Select the comment and edit it
    const editedComment = await Comment.findByIdAndUpdate(
        commentID, 
        { content: newContent },
        { new: true } // Returns the updated comment
    );

    const postID = editedComment.postID;

    res.redirect(`/viewPost/${postID}`);
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

app.get("/delete/:postId", isAuthenticated, async (req, res) => {
    const userData = req.session.user;
    const userId = userData._id;

    // Gather details of the post to be deleted
    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Delete the post
    await Post.deleteOne({ _id: new mongoose.Types.ObjectId(postId) })

    // Delete all comments associated with the post
    await Comment.deleteMany({postID: new mongoose.Types.ObjectId(postId)})

    // Send a json request back to whatever page the user is on that the post has been liked
    return res.redirect("/viewAllPosts");
})

app.get("/deleteComment/:commentId", isAuthenticated, async (req, res) => {

    // Gather details of the comment to be deleted
    const commentId = req.params.commentId;
    const post = await Comment.findById(commentId).select("postID");
    const postId = post.postID.toString();
    console.log("Post ID: " + postId);

    /* if (!post) {
        return res.status(404).json({ message: "Post not found" });
    } */
    
    // Delete comment
    await Comment.deleteOne({ _id: new mongoose.Types.ObjectId(commentId) })

    res.redirect(`/viewPost/${postId}`);
})

/* Post method to change the current user's profile picture in edit profile */
app.post("/changeProfileImage", isAuthenticated, async (req, res) => {
    const userData = req.session.user; 

    if (!req.files || !req.files.profilePic){
        return res.status(400).send("No image uploaded");
    }

    const profilePic = req.files.profilePic;
    const imageName = `profile_${userData._id}${path.extname(profilePic.name)}`;
    const imagePath = path.join('/tmp/images', imageName);

    try {
        if (!fs.existsSync(imageDestination)) {
            fs.mkdirSync(imageDestination, { recursive: true });
        }

        // If there is an uploaded profilePic & it is not the same as the default image, change the pfp
        if (userData.profilePic && userData.profilePic !== "/defaultImage.png") {
            const oldImagePath = path.join("/tmp", userData.profilePic);
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
      let posts;

      if (!searchQuery) {
        posts = await Post.find().populate("userID").lean();
      }else{

      // Create a regex for case-insensitive search
      const searchRegex = new RegExp(searchQuery, 'i');
      
      // Search in multiple fields: title, content, and tags
      posts = await Post.find({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tag: searchRegex }
        ]
      })
      .populate("userID")
      .lean();
    }
       res.json({posts});
     
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Error performing search" });
    }
  });
  

  app.get("/filter", isAuthenticated, async(req, res) =>{
    try{
        const filterQuery = req.query.q;

        const filterRegex = new RegExp(filterQuery, 'i');

        const filteredPost = await Post.find({tag : filterRegex}).populate("userID").lean();

        res.json({filteredPost});

    } catch(error){
        console.error("Filter error:", error);
      res.status(500).json({ error: "Error performing filter" });
    }



  })

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Listening to port 3000');
});