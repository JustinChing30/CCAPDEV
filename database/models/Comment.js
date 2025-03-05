const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    content: String, // Post content
    userID: Number, // Was used to link Users to Posts. like it only showed posts where userID of User = userID of Post
    username: String
})

const Comment = mongoose.model('CommentEntry', PostSchema) // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Comment