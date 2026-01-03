const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('../middleware/requireAuth');
const optionalAuth = require('../middleware/optionalAuth'); // For reading comments (maybe show if user reported?)

// --- COMMENTS ---

// POST /api/comments - Add a comment
router.post('/comments', requireAuth, async (req, res) => {
    const { meal_id, comment_text } = req.body;

    if (!meal_id || !comment_text) {
        return res.status(400).json({ message: 'Meal ID ve yorum metni gereklidir.' });
    }

    try {
        const userId = req.user.id;

        // Check if user already commented on this meal
        const [existing] = await db.query(
            'SELECT comment_id FROM comments WHERE user_id = ? AND meal_id = ?',
            [userId, meal_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Bu yemek için zaten yorum yaptınız.' });
        }

        // Insert comment
        await db.query(
            'INSERT INTO comments (user_id, meal_id, comment_text) VALUES (?, ?, ?)',
            [userId, meal_id, comment_text]
        );

        res.status(201).json({ message: 'Yorum eklendi.' });
    } catch (error) {
        console.error('Post comment error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// GET /api/comments/:mealId - Get comments for a meal
router.get('/comments/:mealId', async (req, res) => {
    const mealId = req.params.mealId;

    try {
        const [comments] = await db.query(
            `SELECT c.comment_id, c.comment_text, c.created_at, 
                    u.user_id, u.name, u.profile_picture_path,
                    r.score as user_rating
             FROM comments c
             JOIN users u ON c.user_id = u.user_id
             LEFT JOIN ratings r ON c.user_id = r.user_id AND c.meal_id = r.meal_id
             WHERE c.meal_id = ?
             ORDER BY c.created_at DESC`,
            [mealId]
        );

        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// --- RATINGS ---

// POST /api/rate - Rate a meal
router.post('/rate', requireAuth, async (req, res) => {
    const { meal_id, score } = req.body;

    if (!meal_id || !score) {
        return res.status(400).json({ message: 'Meal ID ve puan gereklidir.' });
    }

    if (score < 1 || score > 5) {
        return res.status(400).json({ message: 'Puan 1 ile 5 arasında olmalıdır.' });
    }

    try {
        const userId = req.user.id;

        // Check if user already rated (Update if exists, or Insert)
        // We'll verify if row exists first to decide (or use INSERT ON DUPLICATE KEY UPDATE)

        // Using ON DUPLICATE KEY UPDATE assuming (user_id, meal_id) is NOT unique in schema dump provided?
        // Checking schema: PRIMARY KEY (`rating_id`), KEY `user_id`...
        // Wait, the schema provided earlier:
        // CREATE TABLE `ratings` ( ... PRIMARY KEY (`rating_id`), ... )
        // It does NOT show a UNIQUE constraint on (user_id, meal_id). 
        // Logic: I should probably enforce one rating per user per meal. 
        // Since schema doesn't enforce it, I will enforce it in code or use delete-then-insert logic.

        // 1. Check existing
        const [existing] = await db.query(
            'SELECT rating_id FROM ratings WHERE user_id = ? AND meal_id = ?',
            [userId, meal_id]
        );

        if (existing.length > 0) {
            // Update
            await db.query(
                'UPDATE ratings SET score = ?, created_at = NOW() WHERE rating_id = ?',
                [score, existing[0].rating_id]
            );
        } else {
            // Insert
            await db.query(
                'INSERT INTO ratings (user_id, meal_id, score) VALUES (?, ?, ?)',
                [userId, meal_id, score]
            );
        }

        // 2. Recalculate Average for Meal
        const [agg] = await db.query(
            'SELECT AVG(score) as avg_score, COUNT(rating_id) as count FROM ratings WHERE meal_id = ?',
            [meal_id]
        );

        const newAvg = agg[0].avg_score || 0;
        const newCount = agg[0].count || 0;

        // 3. Update Meal Table
        await db.query(
            'UPDATE meals SET avg_rating = ?, rating_count = ? WHERE meal_id = ?',
            [newAvg, newCount, meal_id]
        );

        res.json({ message: 'Puan kaydedildi.', avg_rating: newAvg, rating_count: newCount });

    } catch (error) {
        console.error('Rate meal error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
