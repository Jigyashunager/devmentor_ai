import express from 'express';
import { register, login, getMe, updateProfile, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

console.log('🔗 Setting up auth routes...');

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (authentication required)
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.put('/profile', updateProfile);

console.log('✅ Auth routes configured');

export default router;