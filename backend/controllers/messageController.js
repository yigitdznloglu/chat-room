const Message = require('../models/messageModel');

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ recipients: { $size: 0 } }).populate('user', 'username').sort({ timestamp: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

exports.getPrivateMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await Message.find({ recipients: userId }).populate('user', 'username').sort({ timestamp: 1 });
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch private messages' });
    }
};
