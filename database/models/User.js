const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: String,
    username: String, // Username
    password: String, // Password
    contact: String,
    bio: String,
    profilePic: String // temporary, just to fill out deets
})

const User = mongoose.model('User', UserSchema)

module.exports = User