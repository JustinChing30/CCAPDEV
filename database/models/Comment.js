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
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user_schema" }] // an array of likes
}, { versionKey: false })

const Comment = mongoose.model('comment_schema', PostSchema); // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Comment;