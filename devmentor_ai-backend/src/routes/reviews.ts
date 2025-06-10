import express from 'express';
import { submitCodeReview, getUserReviews, getReviewById, deleteReview, updateReview } from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = express.Router();

console.log('📝 Setting up review routes...');

// All review routes require authentication
router.use(protect);

// Review management routes - UPDATED WITH ALL ENDPOINTS
router.post('/', submitCodeReview);           // POST /api/reviews - Submit code for review
router.get('/', getUserReviews);              // GET /api/reviews - Get user's reviews (with pagination)
router.get('/:id', getReviewById);            // GET /api/reviews/:id - Get specific review
router.put('/:id', updateReview);             // PUT /api/reviews/:id - Update review (title, description)
router.delete('/:id', deleteReview);          // DELETE /api/reviews/:id - Delete review

console.log('✅ Review routes configured');

export default router;