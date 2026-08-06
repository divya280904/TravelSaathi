import { db } from '../config/firebase.js';

const notificationClients = new Map();

export const createNotification = async ({ recipient, title, message, type = 'info', metadata = {} }) => {
    if (!recipient) return null;

    try {
        const notificationPayload = {
            recipient,
            title,
            message,
            type,
            metadata: metadata || {},
            isRead: false,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('notifications').add(notificationPayload);
        const notification = { id: docRef.id, ...notificationPayload };

        const client = notificationClients.get(recipient);
        if (client?.res) {
            client.res.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export const streamNotifications = (req, res) => {
    const username = req.user?.username;

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    res.write(': connected\n\n');
    notificationClients.set(username, { res });

    req.on('close', () => {
        notificationClients.delete(username);
    });
};

export const getNotifications = async (req, res) => {
    const username = req.user?.username;

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const snapshot = await db.collection('notifications')
            .where('recipient', '==', username)
            .limit(50)
            .get();

        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: error.message });
    }
};

export const markNotificationsAsRead = async (req, res) => {
    const username = req.user?.username;
    const { ids } = req.body || {};

    if (!username) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const snapshot = await db.collection('notifications').where('recipient', '==', username).get();
        const batch = db.batch();

        snapshot.forEach(doc => {
            if (!ids || ids.length === 0 || ids.includes(doc.id)) {
                batch.update(doc.ref, { isRead: true });
            }
        });

        if (!snapshot.empty) {
            await batch.commit();
        }

        res.json({ status: 'updated' });
    } catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ message: error.message });
    }
};
