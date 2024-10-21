const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/messageModel');
const User = require('./models/userModel');
const authenticateToken = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

const PORT = process.env.PORT || 5000;

app.use(cookieParser());
app.use(bodyParser.json());

app.use('/api/users', userRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,  
    useUnifiedTopology: true,  
})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.set('io', io);

const userSocketMap = new Map();

io.use((socket, next) => {
    const cookie = socket.handshake.headers.cookie;
    if (cookie) {
        const token = cookie.split('; ').find(c => c.startsWith('token='))?.split('=')[1];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) return next(new Error('Authentication error'));
                socket.userId = decoded.id;
                next();
            });
        } else {
            next(new Error('Authentication error'));
        }
    } else {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('a user connected:', socket.userId);

    userSocketMap.set(socket.userId, socket.id);

    socket.on('disconnect', async () => {
        console.log('user disconnected:', socket.userId);
        userSocketMap.delete(socket.userId);
    });

    socket.on('chat message', async (msg) => {
        console.log('chat message received:', msg);
        try {
            const message = new Message({
                user: msg.user._id,
                content: msg.content,
                timestamp: new Date(),
                upvotes: 0,
                downvotes: 0,
                votes: {}
            });
            const savedMessage = await message.save();
            console.log('Message saved:', savedMessage);

            io.emit('chat message', {
                _id: savedMessage._id,
                user: {
                    _id: msg.user._id,
                    username: msg.user.username
                },
                content: msg.content,
                timestamp: savedMessage.timestamp,
                upvotes: savedMessage.upvotes,
                downvotes: savedMessage.downvotes,
                votes: savedMessage.votes
            });
            console.log('chat message emitted:', savedMessage);
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    });

    socket.on('private message', async (msg) => {
        console.log('private message received:', msg);
        try {
            const recipients = await User.find({ username: { $in: msg.recipients } });

            if (recipients.length !== msg.recipients.length) {
                socket.emit('error', 'One or more recipients not found');
                return;
            }

            const message = new Message({
                user: msg.user._id,
                content: msg.content,
                timestamp: new Date(),
                upvotes: 0,
                downvotes: 0,
                votes: {},
                recipients: recipients.map(r => r._id)
            });
            const savedMessage = await message.save();
            console.log('Private message saved:', savedMessage);

            recipients.forEach(recipient => {
                const recipientSocketId = userSocketMap.get(recipient._id.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('private message', {
                        _id: savedMessage._id,
                        user: {
                            _id: msg.user._id,
                            username: msg.user.username
                        },
                        content: msg.content,
                        timestamp: savedMessage.timestamp,
                        recipients: msg.recipients
                    });
                    console.log('private message emitted to recipient:', recipient.username);
                }
            });

            const senderSocketId = userSocketMap.get(msg.user._id.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit('private message', {
                    _id: savedMessage._id,
                    user: {
                        _id: msg.user._id,
                        username: msg.user.username
                    },
                    content: msg.content,
                    timestamp: savedMessage.timestamp,
                    recipients: msg.recipients
                });
                console.log('private message emitted to sender:', msg.user.username);
            }
        } catch (error) {
            console.error('Error sending private message:', error);
        }
    });

    socket.on('upvote', async ({ messageId, userId }) => {
        try {
            const message = await Message.findById(messageId).populate('user', 'username');
            if (!message.votes) {
                message.votes = new Map();
            }
            if (message.votes.get(userId) === 'downvote') {
                message.downvotes -= 1;
            }
            if (message.votes.get(userId) !== 'upvote') {
                message.upvotes += 1;
                message.votes.set(userId, 'upvote');
            }
            const updatedMessage = await message.save();
            io.emit('message updated', {
                _id: updatedMessage._id,
                user: {
                    _id: updatedMessage.user._id,
                    username: updatedMessage.user.username
                },
                content: updatedMessage.content,
                timestamp: updatedMessage.timestamp,
                upvotes: updatedMessage.upvotes,
                downvotes: updatedMessage.downvotes,
                votes: updatedMessage.votes
            });
        } catch (error) {
            console.error('Error upvoting message:', error);
        }
    });

    socket.on('downvote', async ({ messageId, userId }) => {
        try {
            const message = await Message.findById(messageId).populate('user', 'username');
            if (!message.votes) {
                message.votes = new Map();
            }
            if (message.votes.get(userId) === 'upvote') {
                message.upvotes -= 1;
            }
            if (message.votes.get(userId) !== 'downvote') {
                message.downvotes += 1;
                message.votes.set(userId, 'downvote');
            }
            const updatedMessage = await message.save();
            io.emit('message updated', {
                _id: updatedMessage._id,
                user: {
                    _id: updatedMessage.user._id,
                    username: updatedMessage.user.username
                },
                content: updatedMessage.content,
                timestamp: updatedMessage.timestamp,
                upvotes: updatedMessage.upvotes,
                downvotes: updatedMessage.downvotes,
                votes: updatedMessage.votes
            });
        } catch (error) {
            console.error('Error downvoting message:', error);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
