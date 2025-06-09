import { Router } from 'express';

const router = Router();

// GET /api/users
router.get('/', (req, res) => {
  res.json({ message: 'Users endpoint' });
});

// POST /api/users
router.post('/', (req, res) => {
  res.json({ message: 'Create user endpoint' });
});

export default router;