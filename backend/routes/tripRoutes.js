import express from 'express';
import {
    proposeTrip,
    getTrips,
    getMyTrips,
    addInterest,
    getInterests,
    removeInterest,
    deleteTrip,
    searchTrips,
    approveInterest,
    rejectInterest
} from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getTrips)
    .put(protect, addInterest);

router.post('/propose', protect, proposeTrip);
router.get('/mytrips/:username', protect, getMyTrips);
router.delete('/mytrips', protect, deleteTrip);
router.get('/interests/:username', protect, getInterests);
router.delete('/interests', protect, removeInterest);
router.post('/search', searchTrips);

router.put('/approve', protect, approveInterest);
router.put('/reject', protect, rejectInterest);

export default router;
