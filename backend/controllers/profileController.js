import { db } from '../config/firebase.js';

/**
 * Get user profile preferences
 * GET /api/users/profile/:username
 */
export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const profileRef = db.collection('profiles');
        const querySnapshot = await profileRef.where('username', '==', username).get();

        if (querySnapshot.empty) {
            // Fallback empty profile representation
            return res.json({
                username,
                age: '',
                gender: '',
                bio: '',
                budget: 'moderate',
                pace: 'active',
                style: 'city',
                interests: [],
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
            });
        }

        let profileData;
        querySnapshot.forEach(doc => {
            profileData = doc.data();
        });

        res.json(profileData);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Create or update user profile preferences
 * POST /api/users/profile
 */
export const updateUserProfile = async (req, res) => {
    const { age, gender, bio, budget, pace, style, interests, avatar } = req.body;
    // req.user is hydrated by the JWT auth middleware
    const username = req.user.username; 

    try {
        const profileRef = db.collection('profiles');
        const querySnapshot = await profileRef.where('username', '==', username).get();

        const profileData = {
            username,
            age: age || '',
            gender: gender || '',
            bio: bio || '',
            budget: budget || 'moderate',
            pace: pace || 'active',
            style: style || 'city',
            interests: interests || [],
            avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            updatedAt: new Date().toISOString()
        };

        if (querySnapshot.empty) {
            profileData.createdAt = new Date().toISOString();
            await profileRef.add(profileData);
        } else {
            let docId;
            querySnapshot.forEach(doc => {
                docId = doc.id;
            });
            await profileRef.doc(docId).update(profileData);
        }

        res.json({ status: 'profileupdated', profile: profileData });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: error.message });
    }
};
