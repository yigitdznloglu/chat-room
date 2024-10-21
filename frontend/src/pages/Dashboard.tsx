import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import { format, parseISO } from 'date-fns';
import io from 'socket.io-client';
import axios from 'axios';
import { FaArrowUp, FaArrowDown, FaLock, FaUnlock } from 'react-icons/fa';
import { IoIosSend, IoIosLogOut } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const backendUrl = process.env.REACT_APP_BACKEND_URL;
if (!backendUrl) {
    throw new Error("REACT_APP_BACKEND_URL is not defined");
}
const socket = io(backendUrl, {
    transports: ['websocket']
});

type Message = { 
    _id: string,
    content: string,
    user: {
        _id: string,
        username: string
    },
    timestamp: string,
    upvotes: number,
    downvotes: number,
    votes: Record<string, 'upvote' | 'downvote'>,
    recipients?: string[]
};

type User = {
    _id: string,
    username: string
};

export default function Dashboard() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [recipientsInput, setRecipientsInput] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const previousMessagesCount = useRef(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/users/me`, {
                    withCredentials: true
                });
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };

        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            const fetchMessages = async () => {
                try {
                    const [publicResponse, privateResponse] = await Promise.all([
                        axios.get(`${backendUrl}/api/messages`, { withCredentials: true }),
                        axios.get(`${backendUrl}/api/messages/private`, { withCredentials: true })
                    ]);
                    setMessages([...publicResponse.data, ...privateResponse.data]);
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            };

            fetchMessages();

            socket.on('connect', () => {
                if (currentUser) {
                    socket.emit('register', { userId: currentUser._id });
                }
            });

            socket.on('chat message', (msg : Message) => {
                setMessages((prevMessages) => {
                    if (!prevMessages.some(m => m._id === msg._id)) {
                        return [...prevMessages, msg];
                    }
                    return prevMessages;
                });
            });

            socket.on('private message', (msg : Message) => {
                if (msg.recipients?.includes(currentUser.username) || msg.user._id === currentUser._id) {
                    setMessages((prevMessages) => {
                        if (!prevMessages.some(m => m._id === msg._id)) {
                            return [...prevMessages, msg];
                        }
                        return prevMessages;
                    });
                }
            });

            socket.on('message updated', (updatedMessage : Message) => {
                setMessages((prevMessages) => prevMessages.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
            });

            return () => {
                socket.off('connect');
                socket.off('chat message');
                socket.off('private message');
                socket.off('message updated');
            };
        }
    }, [currentUser]);

    useEffect(() => {
        if (chatHistoryRef.current && messages.length > previousMessagesCount.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
        previousMessagesCount.current = messages.length;
    }, [messages]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
        event.preventDefault();
        if (messageInput.trim() !== '' && currentUser) {
            const newMessage: Message = {
                _id: '',
                content: messageInput,
                user: {
                    _id: currentUser._id,
                    username: currentUser.username
                },
                timestamp: new Date().toISOString(),
                upvotes: 0,
                downvotes: 0,
                votes: {},
                recipients: isPrivate ? recipientsInput.split(',').map(username => username.trim()) : []
            };
    
            if (isPrivate) {
                socket.emit('private message', newMessage);
            } else {
                socket.emit('chat message', newMessage);
            }
    
            setMessageInput('');
            setRecipientsInput('');
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    };

    const handleUpvote = (messageId: string) => {
        if (currentUser) {
            socket.emit('upvote', { messageId, userId: currentUser._id });
        }
    };

    const handleDownvote = (messageId: string) => {
        if (currentUser) {
            socket.emit('downvote', { messageId, userId: currentUser._id });
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = parseISO(timestamp);
        return format(date, 'yyyy-MM-dd HH:mm');
    };

    const isUpvotedByUser = (message: Message) => {
        return currentUser && message.votes && message.votes[currentUser._id] === 'upvote';
    };

    const isDownvotedByUser = (message: Message) => {
        return currentUser && message.votes && message.votes[currentUser._id] === 'downvote';
    };

    const handleLogout = () => {
        Cookies.remove('token');
        navigate('/');
    };

    return (
        <div id="dashboard">
            <div className="chat-section">
                <div className="chat-history" ref={chatHistoryRef}>
                    {messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map((message, index) => {
                        return (
                            <div key={index} className={"message-wrapper " + (currentUser?.username === message.user.username ? 'own' : 'other')}>
                                <div className={"message-label " + (currentUser?.username === message.user.username ? 'own-label' : 'other-label')}>
                                    {message.user.username} <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
                                </div>
                                <div className={"message " + (currentUser?.username === message.user.username ? 'own' : 'other')}>
                                    {message.content}
                                </div>
                                <div className="vote-buttons">
                                    <button 
                                        className={`upvote-button ${isUpvotedByUser(message) ? 'active' : ''}`} 
                                        onClick={() => handleUpvote(message._id)}>
                                        <FaArrowUp /> {message.upvotes}
                                    </button>
                                    <button 
                                        className={`downvote-button ${isDownvotedByUser(message) ? 'active' : ''}`} 
                                        onClick={() => handleDownvote(message._id)}>
                                        <FaArrowDown /> {message.downvotes}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <form onSubmit={handleSubmit}>
                    {isPrivate && (
                        <textarea
                            value={recipientsInput}
                            onChange={(e) => setRecipientsInput(e.target.value)}
                            placeholder="Enter recipient usernames, separated by commas"
                        ></textarea>
                    )}
                    <div className="message-input-container">
                        <button
                            type="button"
                            className="lock-button"
                            onClick={() => setIsPrivate(!isPrivate)}
                        >
                            {isPrivate ? <FaLock size={24} /> : <FaUnlock size={24} />}
                        </button>
                        <textarea
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message here..."
                        ></textarea>
                        <button type="submit" className="send-button">
                            <IoIosSend size={24} />
                        </button>
                        <button type="button" className="logout-button" onClick={handleLogout}>
                            <IoIosLogOut size={24} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
