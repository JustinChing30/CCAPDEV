const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    userID: Number,
    username: String, // Username
    password: String, // Password
    bio: String,
    profilePic: Image
})

const User = mongoose.model('User', UserSchema)

module.exports = User