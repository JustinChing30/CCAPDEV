const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: String,
    username: String, // Username
    hash: String,
    salt: String,
    contact: String,
    bio: String,
    github: String, 
    profilePic: {type: String, default: "/images/defaultImage.png"},
    nickname: String
})

const User = mongoose.model('user_schema', UserSchema)

module.exports = User