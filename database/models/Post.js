const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    image: String,
    userID: Number
})

const Post = mongoose.model('BlogEntry', PostSchema) // mongoose.model(<Collectionname>, <CollectionSchema>)

module.exports = Post