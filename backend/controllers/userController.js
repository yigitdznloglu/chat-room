const User = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/authUtils');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPasswordData = hashPassword(password);

        const newUser = new User({
            username,
            password: hashedPasswordData.hashedPassword,
            salt: hashedPasswordData.salt,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = comparePassword(password, { salt: user.salt, hashedPassword: user.password });
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
           .status(200)
           .json({ message: 'User logged in successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -salt');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
};
