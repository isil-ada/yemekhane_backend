const express = require('express');
const router = express.Router();
const db = require('../config/db');
const optionalAuth = require('../middleware/optionalAuth');

// Helper function to get menu
async function getMenu(req, res, mealType) {
    try {
        // Default to today or provided date
        let date = req.query.date;
        if (!date) {
            const now = new Date();
            date = now.toISOString().split('T')[0]; // YYYY-MM-DD
        }

        // 1. Get Meal Info
        const [meals] = await db.query(
            'SELECT * FROM meals WHERE date = ? AND meal_type = ?',
            [date, mealType]
        );

        if (meals.length === 0) {
            return res.status(404).json({ message: 'Bu tarih için yemek listesi bulunamadı.', date, mealType });
        }

        const meal = meals[0];

        // 2. Get Dishes for this meal
        // Order by position if available, else by Dish ID or Category
        const [dishes] = await db.query(
            `SELECT d.dish_id, d.name, d.category 
             FROM meal_dishes md 
             JOIN dishes d ON md.dish_id = d.dish_id 
             WHERE md.meal_id = ? 
             ORDER BY md.position ASC`,
            [meal.meal_id]
        );

        // 3. Check Favorites (if user is logged in)
        let processedDishes = dishes.map(d => ({ ...d, is_favorite: false }));

        if (req.user) {
            const userId = req.user.id;
            const [favorites] = await db.query(
                `SELECT dish_id FROM favorites WHERE user_id = ? AND dish_id IN (?)`,
                [userId, dishes.map(d => d.dish_id).length > 0 ? dishes.map(d => d.dish_id) : [0]] // Handle empty dishes case
            );

            const favDishIds = new Set(favorites.map(f => f.dish_id));
            processedDishes = processedDishes.map(d => ({
                ...d,
                is_favorite: favDishIds.has(d.dish_id)
            }));
        }

        // 4. Check User Rating (if logged in)
        let userRating = null;
        if (req.user) {
            const [ratings] = await db.query(
                'SELECT score FROM ratings WHERE user_id = ? AND meal_id = ?',
                [req.user.id, meal.meal_id]
            );
            if (ratings.length > 0) {
                userRating = ratings[0].score;
            }
        }

        res.json({
            date: meal.date,
            meal_id: meal.meal_id,
            meal_type: meal.meal_type,
            avg_rating: meal.avg_rating,
            rating_count: meal.rating_count,
            user_rating: userRating,
            total_calories: meal.total_calories || 0,
            dishes: processedDishes
        });

    } catch (error) {
        console.error('Menu error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
}

async function getMonthlyMenu(req, res, mealType) {
    try {
        const now = new Date();
        const year = req.query.year || now.getFullYear();
        const month = req.query.month || (now.getMonth() + 1);

        // 1. Get All Meals for Month
        const [meals] = await db.query(
            'SELECT * FROM meals WHERE YEAR(date) = ? AND MONTH(date) = ? AND meal_type = ? ORDER BY date ASC',
            [year, month, mealType]
        );

        if (meals.length === 0) {
            return res.status(200).json([]); // Return empty array if no meals found
        }

        const mealIds = meals.map(m => m.meal_id);

        // 2. Get All Dishes for these meals
        const [dishes] = await db.query(
            `SELECT md.meal_id, d.dish_id, d.name, d.category 
             FROM meal_dishes md 
             JOIN dishes d ON md.dish_id = d.dish_id 
             WHERE md.meal_id IN (?) 
             ORDER BY md.position ASC`,
            [mealIds]
        );

        // 3. User Specific Data (Favorites & Ratings)
        let favDishIds = new Set();
        let userRatingsMap = new Map(); // meal_id -> score

        if (req.user) {
            const userId = req.user.id;

            // Favorites
            const dishIds = dishes.map(d => d.dish_id);
            if (dishIds.length > 0) {
                const [favorites] = await db.query(
                    `SELECT dish_id FROM favorites WHERE user_id = ? AND dish_id IN (?)`,
                    [userId, dishIds]
                );
                favorites.forEach(f => favDishIds.add(f.dish_id));
            }

            // Ratings
            const [ratings] = await db.query(
                'SELECT meal_id, score FROM ratings WHERE user_id = ? AND meal_id IN (?)',
                [userId, mealIds]
            );
            ratings.forEach(r => userRatingsMap.set(r.meal_id, r.score));
        }

        // 4. Group Dishes by Meal
        const mealsWithDishes = meals.map(meal => {
            const mealDishes = dishes
                .filter(d => d.meal_id === meal.meal_id)
                .map(d => ({
                    dish_id: d.dish_id,
                    name: d.name,
                    category: d.category,
                    is_favorite: favDishIds.has(d.dish_id)
                }));

            return {
                date: meal.date,
                meal_id: meal.meal_id,
                meal_type: meal.meal_type,
                avg_rating: meal.avg_rating,
                rating_count: meal.rating_count,
                user_rating: userRatingsMap.get(meal.meal_id) || null,
                total_calories: meal.total_calories || 0,
                dishes: mealDishes
            };
        });

        res.json(mealsWithDishes);

    } catch (error) {
        console.error('Monthly Menu error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
}

router.get('/lunch/month', optionalAuth, (req, res) => {
    getMonthlyMenu(req, res, 'ogle');
});

router.get('/dinner/month', optionalAuth, (req, res) => {
    getMonthlyMenu(req, res, 'aksam');
});

router.get('/lunch', optionalAuth, (req, res) => {
    getMenu(req, res, 'ogle');
});

router.get('/dinner', optionalAuth, (req, res) => {
    getMenu(req, res, 'aksam');
});

module.exports = router;
