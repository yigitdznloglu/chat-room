const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    salt: {
        type: String,
        required: true,
    },
    socketId: {
        type: String,
        default: null,
    },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
