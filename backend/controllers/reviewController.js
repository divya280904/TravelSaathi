import { db } from '../config/firebase.js';

export const getReviews = async (req, res) => {
    const { username } = req.params;
    try {
        const reviewsRef = db.collection('reviews');
        const snapshot = await reviewsRef.where('reviewee', '==', username).get();
        const reviews = [];
        
        snapshot.forEach(doc => {
            reviews.push(doc.data());
        });
        
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addReview = async (req, res) => {
    const { reviewee, rating, comment } = req.body;
    const reviewer = req.user.username;

    if (reviewer === reviewee) {
        return res.status(400).json({ message: "You cannot review yourself." });
    }

    try {
        const review = {
            reviewer,
            reviewee,
            rating: Number(rating),
            comment,
            createdAt: new Date().toISOString()
        };

        await db.collection('reviews').add(review);
        res.json({ status: "reviewadded", review });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
