const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    title: String, // Title
    tag: String, // The post tag (CCAPDEV, CCINFOM, etc.)
    content: String, // Post content
    userID: Number, // Was used to link Users to Posts. like it only showed posts where userID of User = userID of Post
    username: String // username of person that posted it
    // NOTE: need to add here a list of the different users that have liked the post
})

const Post = mongoose.model('PostEntry', PostSchema) // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Post