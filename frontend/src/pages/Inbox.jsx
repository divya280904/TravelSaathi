import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';
import '../App.css';

const Inbox = () => {
    const { showToast } = useToast();
    const username = localStorage.getItem('name');
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    // Fetch active chats list
    useEffect(() => {
        async function fetchChats() {
            try {
                const res = await api.get('/api/chats');
                setChats(res.data);
                if (res.data.length > 0 && !activeChat) {
                    // Default to first chat room
                    setActiveChat(res.data[0]);
                }
            } catch (error) {
                console.error('Error fetching chats:', error);
            }
        }
        fetchChats();
    }, [activeChat]);

    // Fetch active chat messages and poll for updates
    useEffect(() => {
        if (!activeChat) return;

        async function fetchMessages() {
            try {
                const res = await api.get(`/api/chats/${activeChat.chatRoomId}`);
                setMessages(res.data.messages || []);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        }

        fetchMessages();

        // Setup real-time simulation via 3-second polling
        const interval = setInterval(fetchMessages, 3000);
        
        return () => clearInterval(interval);
    }, [activeChat]);

    // Scroll chat to bottom when messages load/change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send Message handler
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeChat) return;

        const text = inputText;
        setInputText(''); // Clear input

        try {
            const res = await api.post(`/api/chats/${activeChat.chatRoomId}/message`, { text });
            if (res.data.status === 'sent') {
                // Update local state instantly
                setMessages(prevMsgs => [...prevMsgs, res.data.message]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message.', 'danger');
        }
    };

    const getChatTitle = (chat) => {
        return `Group: Trip to ${chat.location}`;
    };

    const getAvatarSeed = (chat) => {
        return `${chat.tripID}-group`;
    };

    return (
        <div className="content" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <h2 className="welcome-title" style={{ textAlign: 'left', margin: '0 0 20px 0' }}>Your Messages</h2>
            
            {chats.length > 0 ? (
                <div className="inbox-container flex-grow-1" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '25px', height: '80%' }}>
                    {/* Left sidebar listing chats */}
                    <div className="inbox-list neo-raised">
                        {chats.map(chat => {
                            const title = getChatTitle(chat);
                            const avatarSeed = getAvatarSeed(chat);
                            const isActive = activeChat && activeChat.chatRoomId === chat.chatRoomId;
                            return (
                                <div 
                                    className={`inbox-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveChat(chat)}
                                    key={chat.chatRoomId}
                                >
                                    <img 
                                        src={`https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`} 
                                        alt="avatar" 
                                        style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
                                    />
                                    <div className="inbox-item-info">
                                        <span className="inbox-item-title">{title}</span>
                                        <span className="inbox-item-sub">{chat.isGroupChat ? `${chat.participants.length} Participants` : `Trip to ${chat.location}`}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right side chat view */}
                    <div className="chat-room neo-raised">
                        {activeChat ? (
                            <>
                                <div className="chat-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img 
                                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${getAvatarSeed(activeChat)}`} 
                                            alt="avatar" 
                                            style={{ width: '45px', height: '45px', borderRadius: '50%' }} 
                                        />
                                        <div>
                                            <h3 style={{ textAlign: 'left', fontSize: '18px', padding: 0, margin: 0 }}>
                                                {getChatTitle(activeChat)}
                                            </h3>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                Group Discussion
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="chat-messages">
                                    {messages.length > 0 ? (
                                        messages.map((msg, index) => {
                                            const isOutgoing = msg.sender === username;
                                            return (
                                                <div 
                                                    className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`} 
                                                    key={index}
                                                >
                                                    {!isOutgoing && (
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 'bold' }}>
                                                            {msg.sender}
                                                        </div>
                                                    )}
                                                    {msg.text}
                                                    <div style={{ fontSize: '9px', textAlign: 'right', marginTop: '4px', opacity: 0.8 }}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            👋 Say hello to your travel buddy!
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="chat-input-area">
                                    <input 
                                        type="text" 
                                        className="neo-input" 
                                        placeholder="Type your message..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        style={{ flexGrow: 1 }}
                                    />
                                    <button type="submit" className="neo-btn neo-btn-primary">
                                        Send 🚀
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Select a chat conversation from the left to start messaging.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="neo-panel neo-pressed" style={{ padding: '60px', textAlign: 'center', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div>
                        <p className="noData" style={{ fontSize: '20px', marginBottom: '10px' }}>No active chats yet</p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Once a trip host approves your request to join, your chat room will automatically appear here!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inbox;
