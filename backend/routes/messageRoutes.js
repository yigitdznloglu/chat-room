const express = require('express');
const { getMessages, getPrivateMessages } = require('../controllers/messageController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getMessages);
router.get('/private', authenticateToken, getPrivateMessages);

module.exports = router;
