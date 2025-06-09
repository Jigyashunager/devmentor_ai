import express from 'express';
import { register, login, getMe, updateProfile, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes (authentication required)
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.put('/profile', updateProfile);

export default router;