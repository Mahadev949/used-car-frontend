import express from 'express';
import { query } from '../db/connection.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All history routes require authentication
router.use(authenticateToken);

// GET /api/history
router.get('/', async (req, res) => {
  try {
    // Use authenticated user's ID
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;

    const result = await query(
      `SELECT * FROM predictions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      predictions: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;

