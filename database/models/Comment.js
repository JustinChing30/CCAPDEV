const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    content: String, // Post content
    commenterID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // references the _id of the user that posted 
    },
    postID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post" // references the _id of the post
    }
    // NOTE: need to add here a list of the different users that have liked the comment
})

const Comment = mongoose.model('CommentEntry', PostSchema) // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Comment