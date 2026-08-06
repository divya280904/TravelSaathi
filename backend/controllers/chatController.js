import { db, admin } from '../config/firebase.js';

/**
 * Get all chat rooms for the logged in user
 * GET /api/chats
 */
export const getUserChats = async (req, res) => {
    const username = req.user.username;

    try {
        const chatsRef = db.collection('chats');
        // Find group chats where user is a participant
        const groupSnapshot = await chatsRef.where('participants', 'array-contains', username).get();

        const chatsMap = new Map();
        
        groupSnapshot.forEach(doc => {
            chatsMap.set(doc.id, doc.data());
        });

        const chats = Array.from(chatsMap.values());

        // Sort by last message/creation date
        chats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get details for a specific chat room
 * GET /api/chats/:chatRoomId
 */
export const getChatMessages = async (req, res) => {
    const { chatRoomId } = req.params;
    const username = req.user.username;

    try {
        const chatDoc = await db.collection('chats').doc(chatRoomId).get();

        if (!chatDoc.exists) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        const chatData = chatDoc.data();

        // Verify participant
        let isAuthorized = chatData.participants && chatData.participants.includes(username);

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }

        res.json(chatData);
    } catch (error) {
        console.error('Error fetching chat details:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Send a message in a chat room
 * POST /api/chats/:chatRoomId/message
 */
export const sendMessage = async (req, res) => {
    const { chatRoomId } = req.params;
    const { text } = req.body;
    const username = req.user.username;

    try {
        const chatRef = db.collection('chats').doc(chatRoomId);
        const chatDoc = await chatRef.get();

        if (!chatDoc.exists) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        const chatData = chatDoc.data();

        // Verify participant
        let isAuthorized = chatData.participants && chatData.participants.includes(username);

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to post messages' });
        }

        const newMessage = {
            sender: username,
            text,
            timestamp: new Date().toISOString()
        };

        await chatRef.update({
            messages: admin.firestore.FieldValue.arrayUnion(newMessage),
            lastMessageAt: new Date().toISOString()
        });

        res.json({ status: 'sent', message: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Remove a participant from a chat room (Host can kick, member can leave)
 * POST /api/chats/:chatRoomId/participants
 */
export const removeParticipant = async (req, res) => {
    const { chatRoomId } = req.params;
    const { participant } = req.body;
    const username = req.user.username;

    try {
        const chatRef = db.collection('chats').doc(chatRoomId);
        const chatDoc = await chatRef.get();

        if (!chatDoc.exists) {
            return res.status(404).json({ message: 'Chat room not found' });
        }

        const chatData = chatDoc.data();

        if (username !== chatData.host && username !== participant) {
            return res.status(403).json({ message: 'Not authorized to remove this participant' });
        }

        if (chatData.host === participant) {
            return res.status(400).json({ message: 'Host cannot be removed or leave the chat directly' });
        }

        await chatRef.update({
            participants: admin.firestore.FieldValue.arrayRemove(participant)
        });

        res.json({ status: 'removed' });
    } catch (error) {
        console.error('Error removing participant:', error);
        res.status(500).json({ message: error.message });
    }
};

