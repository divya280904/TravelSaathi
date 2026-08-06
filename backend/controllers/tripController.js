import { db, admin } from '../config/firebase.js';
import { generateRandomID } from '../utils/helpers.js';
import axios from 'axios';
import { createNotification } from './notificationController.js';

/**
 * Enriches trips with the trip creator's travel profile
 */
const attachCreatorProfiles = async (trips) => {
    const profileRef = db.collection('profiles');
    const enrichedTrips = [];
    
    for (const trip of trips) {
        let creatorProfile = null;
        if (trip.username) {
            const querySnapshot = await profileRef.where('username', '==', trip.username).get();
            if (!querySnapshot.empty) {
                querySnapshot.forEach(doc => {
                    creatorProfile = doc.data();
                });
            }
        }
        enrichedTrips.push({
            ...trip,
            creatorProfile: creatorProfile || {
                username: trip.username,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${trip.username}`,
                budget: 'moderate',
                pace: 'active',
                style: 'city',
                bio: 'No bio written yet.',
                interests: []
            }
        });
    }
    return enrichedTrips;
};

/**
 * Propose a new trip with budget and style preferences
 * POST /api/trips/propose
 */
export const proposeTrip = async (req, res) => {
    const { location, date, time, duration, username, budget, style } = req.body;
    const weatherAPIKey = process.env.WEATHER_API_KEY || "e9522cc09ce444238ff202255240209";

    try {
        const fetchWeather = async () => {
            try {
                const response = await axios.get(
                    `https://api.worldweatheronline.com/premium/v1/weather.ashx?key=${weatherAPIKey}&q=${location}&num_of_days=${duration}&date=${date}&format=json`,
                    { timeout: 5000 }
                );
                
                const weatherData = response.data;
                if (weatherData && weatherData.data && weatherData.data.current_condition && weatherData.data.current_condition[0]) {
                    const currentCondition = weatherData.data.current_condition[0];
                    const temp = currentCondition.temp_C;
                    const condition = currentCondition.weatherDesc[0].value;
                    return { temp, condition };
                }
                return { temp: "N/A", condition: "Unknown (No data returned)" };
            } catch (error) {
                console.error("Error fetching weather data in backend:", error.message);
                return { temp: "N/A", condition: "Weather service unavailable" };
            }
        };

        const tripsRef = db.collection('trips');
        let randomID;
        let idExists = true;
        
        do {
            randomID = await generateRandomID();
            const idSnapshot = await tripsRef.where('tripID', '==', randomID.toString()).get();
            idExists = !idSnapshot.empty;
        } while (idExists);

        const weather = await fetchWeather();

        const newTrip = {
            location,
            date,
            time,
            duration,
            tripID: randomID.toString(),
            username,
            weather,
            budget: budget || 'moderate',
            style: style || 'city',
            interested: [], // Approved buddies
            pendingInterests: [], // Requested buddies
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await tripsRef.add(newTrip);

        const groupChatRoomId = `${randomID}_group`;
        const chatsRef = db.collection('chats');
        await chatsRef.doc(groupChatRoomId).set({
            chatRoomId: groupChatRoomId,
            tripID: randomID.toString(),
            location: location,
            host: username,
            isGroupChat: true,
            participants: [username],
            messages: [],
            createdAt: new Date().toISOString()
        });

        res.json({
            status: "tripcreated",
            tripID: randomID.toString(),
            username
        });
    } catch (error) {
        console.error("Error creating trip:", error);
        res.json("tripnotcreated");
    }
};

/**
 * Get top 8 trips sorted by date with creator profiles attached, supporting pagination
 * GET /api/trips?lastTripDate=ISOString
 */
export const getTrips = async (req, res) => {
    try {
        const { lastTripDate } = req.query;
        let tripsRef = db.collection('trips').orderBy('date', 'asc');
        
        if (lastTripDate) {
            tripsRef = tripsRef.startAfter(lastTripDate);
        }
        
        const snapshot = await tripsRef.limit(8).get();
        const trips = [];
        
        snapshot.forEach(doc => {
            trips.push(doc.data());
        });
        
        const enriched = await attachCreatorProfiles(trips);
        res.json({
            trips: enriched,
            hasMore: enriched.length === 8 // Simple heuristic
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get user's own trips
 * GET /api/trips/mytrips/:username
 */
export const getMyTrips = async (req, res) => {
    const { username } = req.params;
    try {
        const tripsRef = db.collection('trips');
        const snapshot = await tripsRef.where('username', '==', username).get();
        const trips = [];
        
        snapshot.forEach(doc => {
            trips.push(doc.data());
        });

        trips.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (trips.length > 0) {
            res.json(trips);
        } else {
            res.json({ status: "tripsnotfound" });
        }
    } catch (error) {
        console.error("Error fetching myTrips data:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Express interest (request to join) in a trip
 * PUT /api/trips/interest
 */
export const addInterest = async (req, res) => {
    const { username, tripID } = req.body;
    try {
        const tripsRef = db.collection('trips');
        const querySnapshot = await tripsRef.where('tripID', '==', tripID.toString()).get();
        
        if (querySnapshot.empty) {
            return res.json({ status: "interestnotshown" });
        }

        let docId;
        let tripData;
        querySnapshot.forEach(doc => {
            docId = doc.id;
            tripData = doc.data();
        });

        const pendingInterests = tripData.pendingInterests || [];
        const interested = tripData.interested || [];

        // Check if already requested or approved
        if (!pendingInterests.includes(username) && !interested.includes(username)) {
            const docRef = tripsRef.doc(docId);
            await docRef.update({
                pendingInterests: admin.firestore.FieldValue.arrayUnion(username),
                updatedAt: new Date().toISOString()
            });

            const host = tripData.username;
            if (host) {
                await createNotification({
                    recipient: host,
                    title: 'New trip interest',
                    message: `${username} wants to join your trip to ${tripData.location}.`,
                    type: 'info',
                    metadata: { tripID, requester: username }
                });
            }

            res.json({
                status: "interestshown"
            });
        } else {
            res.json({ status: "interestnotshown" });
        }
    } catch (error) {
        console.error("Error showing interest:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Host approves a buddy request
 * PUT /api/trips/approve
 */
export const approveInterest = async (req, res) => {
    const { username, tripID } = req.body;
    const hostUsername = req.user.username;

    try {
        const tripsRef = db.collection('trips');
        const querySnapshot = await tripsRef.where('tripID', '==', tripID.toString()).get();
        
        if (querySnapshot.empty) {
            return res.status(404).json({ message: "Trip not found" });
        }

        let docId;
        let tripData;
        querySnapshot.forEach(doc => {
            docId = doc.id;
            tripData = doc.data();
        });

        if (tripData.username !== hostUsername) {
            return res.status(403).json({ message: "Only the owner can approve requests" });
        }

        const docRef = tripsRef.doc(docId);
        await docRef.update({
            pendingInterests: admin.firestore.FieldValue.arrayRemove(username),
            interested: admin.firestore.FieldValue.arrayUnion(username),
            updatedAt: new Date().toISOString()
        });

        // Automatically set up a messaging chat room (Group Chat only)
        const chatsRef = db.collection('chats');
        const groupChatRoomId = `${tripID}_group`;
        const groupChatRef = chatsRef.doc(groupChatRoomId);
        const groupChatDoc = await groupChatRef.get();
        
        if (!groupChatDoc.exists) {
            await groupChatRef.set({
                chatRoomId: groupChatRoomId,
                tripID,
                location: tripData.location,
                host: hostUsername,
                isGroupChat: true,
                participants: [hostUsername, username],
                messages: [],
                createdAt: new Date().toISOString()
            });
        } else {
            await groupChatRef.update({
                participants: admin.firestore.FieldValue.arrayUnion(username),
                updatedAt: new Date().toISOString()
            });
        }

        await createNotification({
            recipient: username,
            title: 'Trip request approved',
            message: `Your request to join ${tripData.location} was approved by ${hostUsername}.`,
            type: 'success',
            metadata: { tripID, host: hostUsername }
        });

        const updatedDoc = await docRef.get();
        res.json({ status: "interestapproved", trip: updatedDoc.data() });
    } catch (error) {
        console.error("Error approving request:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Host rejects a buddy request
 * PUT /api/trips/reject
 */
export const rejectInterest = async (req, res) => {
    const { username, tripID } = req.body;
    const hostUsername = req.user.username;

    try {
        const tripsRef = db.collection('trips');
        const querySnapshot = await tripsRef.where('tripID', '==', tripID.toString()).get();
        
        if (querySnapshot.empty) {
            return res.status(404).json({ message: "Trip not found" });
        }

        let docId;
        let tripData;
        querySnapshot.forEach(doc => {
            docId = doc.id;
            tripData = doc.data();
        });

        if (tripData.username !== hostUsername) {
            return res.status(403).json({ message: "Only the owner can reject requests" });
        }

        const docRef = tripsRef.doc(docId);
        await docRef.update({
            pendingInterests: admin.firestore.FieldValue.arrayRemove(username),
            updatedAt: new Date().toISOString()
        });

        await createNotification({
            recipient: username,
            title: 'Trip request update',
            message: `Your request to join ${tripData.location} was not approved this time.`,
            type: 'warning',
            metadata: { tripID, host: hostUsername }
        });

        const updatedDoc = await docRef.get();
        res.json({ status: "interestrejected", trip: updatedDoc.data() });
    } catch (error) {
        console.error("Error rejecting request:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get trips the user is interested in (pending OR approved)
 * GET /api/trips/interests/:username
 */
export const getInterests = async (req, res) => {
    const { username } = req.params;
    try {
        const tripsRef = db.collection('trips');
        
        // Retrieve trips where user is approved buddy
        const approvedSnap = await tripsRef.where('interested', 'array-contains', username).get();
        // Retrieve trips where user is pending buddy
        const pendingSnap = await tripsRef.where('pendingInterests', 'array-contains', username).get();

        const tripsMap = new Map();
        
        approvedSnap.forEach(doc => {
            tripsMap.set(doc.data().tripID, { ...doc.data(), status: 'approved' });
        });
        
        pendingSnap.forEach(doc => {
            tripsMap.set(doc.data().tripID, { ...doc.data(), status: 'pending' });
        });

        const trips = Array.from(tripsMap.values());
        trips.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const enriched = await attachCreatorProfiles(trips);
        res.json(enriched);
    } catch (error) {
        console.error("Error fetching interests data:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Remove interest/request from a trip
 * DELETE /api/trips/interests
 */
export const removeInterest = async (req, res) => {
    const { username, tripID } = req.body;
    try {
        const tripsRef = db.collection('trips');
        const querySnapshot = await tripsRef.where('tripID', '==', tripID.toString()).get();
        
        if (querySnapshot.empty) {
            return res.json({ status: "interestnotfound" });
        }

        let docId;
        querySnapshot.forEach(doc => {
            docId = doc.id;
        });

        const docRef = tripsRef.doc(docId);
        await docRef.update({
            interested: admin.firestore.FieldValue.arrayRemove(username),
            pendingInterests: admin.firestore.FieldValue.arrayRemove(username),
            updatedAt: new Date().toISOString()
        });

        res.json({
            status: "interestremoved"
        });
    } catch (error) {
        console.error("Error removing interest:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete a trip and associated chats
 * DELETE /api/trips/mytrips
 */
export const deleteTrip = async (req, res) => {
    const { tripID } = req.body;
    try {
        const tripsRef = db.collection('trips');
        const querySnapshot = await tripsRef.where('tripID', '==', tripID.toString()).get();
        
        if (querySnapshot.empty) {
            return res.json({ status: "tripnotremoved" });
        }

        const batch = db.batch();
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Also clean up chats related to this trip
        const chatsRef = db.collection('chats');
        const chatSnapshot = await chatsRef.where('tripID', '==', tripID.toString()).get();
        const chatBatch = db.batch();
        chatSnapshot.forEach(doc => {
            chatBatch.delete(doc.ref);
        });
        await chatBatch.commit();

        res.json({ status: "tripremoved" });
    } catch (error) {
        console.error("Error removing trip:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Search trips by location with profiles attached
 * POST /api/trips/search
 */
export const searchTrips = async (req, res) => {
    const { location, startDate, endDate, minDuration, maxDuration } = req.body;
    try {
        const tripsRef = db.collection('trips');
        const snapshot = await tripsRef.get();
        const searchResults = [];
        const regex = location ? new RegExp(location, "i") : null;
        
        snapshot.forEach(doc => {
            const trip = doc.data();
            
            // Location filter
            if (regex && !regex.test(trip.location)) return;

            // Date filtering
            if (startDate && new Date(trip.date) < new Date(startDate)) return;
            if (endDate && new Date(trip.date) > new Date(endDate)) return;

            // Duration filtering
            if (minDuration && parseInt(trip.duration) < parseInt(minDuration)) return;
            if (maxDuration && parseInt(trip.duration) > parseInt(maxDuration)) return;

            searchResults.push(trip);
        });

        searchResults.sort((a, b) => new Date(a.date) - new Date(b.date));

        const enriched = await attachCreatorProfiles(searchResults);
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
