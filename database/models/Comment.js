const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    content: String, // Post content
    commenterID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user_schema" // references the _id of the user that posted 
    },
    postID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post_schema" // references the _id of the post
    }
    // NOTE: need to add here a list of the different users that have liked the comment
})

const Comment = mongoose.model('comment_schema', PostSchema); // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Comment;