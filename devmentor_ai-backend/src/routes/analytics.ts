import { Router } from 'express';

const router = Router();

// GET /api/analytics
router.get('/', (req, res) => {
  res.json({ message: 'Analytics endpoint' });
});

export default router;