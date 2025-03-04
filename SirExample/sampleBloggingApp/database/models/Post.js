const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    image: String,
    userID: Number
})

const Post = mongoose.model('BlogEntry', PostSchema)

module.exports = Post