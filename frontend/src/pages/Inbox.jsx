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
    const [showParticipants, setShowParticipants] = useState(false);
    const [participantToRemove, setParticipantToRemove] = useState(null);
    const messagesEndRef = useRef(null);
    const prevMsgCount = useRef(0);

    // Fetch active chats list
    useEffect(() => {
        async function fetchChats() {
            try {
                const res = await api.get('/api/chats');
                setChats(res.data);
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

    // Reset scroll tracking when changing chats
    useEffect(() => {
        prevMsgCount.current = 0;
    }, [activeChat]);

    // Scroll chat to bottom ONLY when new messages arrive
    useEffect(() => {
        if (messages.length !== prevMsgCount.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            prevMsgCount.current = messages.length;
        }
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

    const handleRemoveParticipant = (participant) => {
        setParticipantToRemove(participant);
    };

    const confirmRemoveParticipant = async () => {
        if (!participantToRemove) return;
        const participant = participantToRemove;
        setParticipantToRemove(null);

        try {
            const res = await api.post(`/api/chats/${activeChat.chatRoomId}/participants`, { participant });
            if (res.data.status === 'removed') {
                showToast(participant === username ? 'You left the chat' : `Participant ${participant} removed`, 'success');
                if (participant === username) {
                    setActiveChat(null);
                    setChats(chats.filter(c => c.chatRoomId !== activeChat.chatRoomId));
                } else {
                    const updatedChat = { ...activeChat, participants: activeChat.participants.filter(p => p !== participant) };
                    setActiveChat(updatedChat);
                    setChats(chats.map(c => c.chatRoomId === updatedChat.chatRoomId ? updatedChat : c));
                }
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to remove participant', 'danger');
        }
    };

    const getChatTitle = (chat) => {
        return `Group: Trip to ${chat.location}`;
    };

    const getAvatarSeed = (chat) => {
        return `${chat.tripID}-group`;
    };

    return (
        <div className="content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 className="welcome-title" style={{ textAlign: 'left', margin: '0 0 20px 0' }}>Your Messages</h2>
            
            {chats.length > 0 ? (
                <div className="inbox-container flex-grow-1">
                    {/* Left sidebar listing chats */}
                    <div className={`inbox-list neo-raised ${activeChat ? 'mobile-hidden' : ''}`}>
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
                    <div className={`chat-room neo-raised ${!activeChat ? 'mobile-hidden' : ''}`}>
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
                                                {activeChat.participants?.length || 0} Participants
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button 
                                            className="neo-btn request-btn-sm mobile-only" 
                                            onClick={() => setActiveChat(null)}
                                        >
                                            ⬅ Back
                                        </button>
                                        <button 
                                            className="neo-btn request-btn-sm" 
                                            onClick={() => setShowParticipants(!showParticipants)}
                                        >
                                            {showParticipants ? 'Hide Participants' : 'View Participants'}
                                        </button>
                                        {activeChat.host !== username && (
                                            <button 
                                                className="neo-btn request-btn-sm" 
                                                style={{ background: 'var(--danger)', color: 'white', marginLeft: '10px' }}
                                                onClick={() => handleRemoveParticipant(username)}
                                            >
                                                Leave Chat
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {showParticipants && activeChat.participants && (
                                    <div className="neo-pressed" style={{ padding: '10px 15px', margin: '0 20px 10px', borderRadius: '12px', fontSize: '13px' }}>
                                        <strong>Participants: </strong>
                                        {activeChat.participants.map((p, idx) => (
                                            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '15px', marginTop: '5px' }}>
                                                <img 
                                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p}`} 
                                                    alt="avatar" 
                                                    style={{ width: '20px', height: '20px', borderRadius: '50%', marginRight: '5px' }} 
                                                />
                                                <Link to={`/profile/${p}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', marginRight: '5px' }}>
                                                    {p}
                                                </Link>
                                                {activeChat.host === username && p !== username && (
                                                    <button 
                                                        className="neo-btn" 
                                                        style={{ padding: '2px 5px', fontSize: '10px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        onClick={() => handleRemoveParticipant(p)}
                                                        title="Remove participant"
                                                    >
                                                        X
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                )}

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
            
            {participantToRemove && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="neo-raised" style={{ padding: '25px', backgroundColor: 'var(--bg-color)', borderRadius: '16px', maxWidth: '400px', textAlign: 'center' }}>
                        <h3 style={{ marginTop: 0 }}>Confirm Action</h3>
                        <p style={{ margin: '15px 0 25px' }}>
                            Are you sure you want to {participantToRemove === username ? 'leave this chat' : `remove ${participantToRemove}`}?
                        </p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button className="neo-btn" onClick={() => setParticipantToRemove(null)}>Cancel</button>
                            <button className="neo-btn" style={{ background: 'var(--danger)', color: 'white', border: 'none' }} onClick={confirmRemoveParticipant}>
                                {participantToRemove === username ? 'Leave Chat' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inbox;
