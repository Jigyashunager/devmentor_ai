import { Router } from 'express';

const router = Router();

// GET /api/reviews
router.get('/', (req, res) => {
  res.json({ message: 'Reviews endpoint' });
});

// POST /api/reviews
router.post('/', (req, res) => {
  res.json({ message: 'Create review endpoint' });
});

export default router;