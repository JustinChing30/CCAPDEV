const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: String, // Username
    password: String // Password
})

const User = mongoose.model('User', UserSchema)

module.exports = User