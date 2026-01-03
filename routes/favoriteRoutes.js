const express = require('express');
const router = express.Router();
const db = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// Apply strict auth middleware to all routes in this router
router.use(requireAuth);

// GET /api/favorites - Get all favorites for the logged-in user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const [favorites] = await db.query(
            `SELECT f.added_at, d.* 
             FROM favorites f
             JOIN dishes d ON f.dish_id = d.dish_id
             WHERE f.user_id = ?
             ORDER BY f.added_at DESC`,
            [userId]
        );
        res.json(favorites);
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// POST /api/favorites - Add a dish to favorites
router.post('/', async (req, res) => {
    const { dish_id } = req.body;

    if (!dish_id) {
        return res.status(400).json({ message: 'Dish ID gerekli.' });
    }

    try {
        const userId = req.user.id;
        await db.query(
            'INSERT IGNORE INTO favorites (user_id, dish_id) VALUES (?, ?)',
            [userId, dish_id]
        );
        res.status(201).json({ message: 'Favorilere eklendi.' });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// DELETE /api/favorites/:dishId - Remove a dish from favorites
router.delete('/:dishId', async (req, res) => {
    const dishId = req.params.dishId;

    try {
        const userId = req.user.id;
        const [result] = await db.query(
            'DELETE FROM favorites WHERE user_id = ? AND dish_id = ?',
            [userId, dishId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Favori bulunamadı.' });
        }

        res.json({ message: 'Favorilerden çıkarıldı.' });
    } catch (error) {
        console.error('Delete favorite error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
