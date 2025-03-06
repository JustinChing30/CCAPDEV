const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    title: String, // Title
    tag: String, // The post tag (CCAPDEV, CCINFOM, etc.)
    content: String, // Post content
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_schema" // references the _id of the User
    } 
    // NOTE: need to add here a list of the different users that have liked the post
})

const Post = mongoose.model('post_schema', PostSchema) // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Post