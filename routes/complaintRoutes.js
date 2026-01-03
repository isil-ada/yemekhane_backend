const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// Apply strict auth middleware to all routes
router.use(requireAuth);

// POST /api/complaints - Submit a complaint
router.post('/', async (req, res) => {
    const { title, description, meal_id } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Başlık ve açıklama gereklidir.' });
    }

    try {
        const userId = req.user.id;

        // Insert complaint
        // meal_id is optional, can be null
        await db.query(
            'INSERT INTO complaints (user_id, meal_id, title, description) VALUES (?, ?, ?, ?)',
            [userId, meal_id || null, title, description]
        );

        res.status(201).json({ message: 'Şikayet/Öneri başarıyla iletildi.' });

    } catch (error) {
        console.error('Post complaint error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// GET /api/complaints - Get user's own complaints
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const [complaints] = await db.query(
            'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        res.json(complaints);
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
