const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: String,
    username: String, // Username
    password: String, // Password
    contact: String,
    bio: String,
    profilepic: String,
    nickname: String
})

const User = mongoose.model('user_schema', UserSchema)

module.exports = User