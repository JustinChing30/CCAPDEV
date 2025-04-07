const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    title: String, // Title
    tag: String, // The post tag (CCAPDEV, CCINFOM, etc.)
    content: String, // Post content
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_schema" // references the _id of the User
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user_schema" }] // an array of likes
}, { versionKey: false})

const Post = mongoose.model('post_schema', PostSchema) // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Post

// LATEST COMMIT 04/07 9:41PM