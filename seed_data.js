const db = require('./config/db');

const dishes = [
    { name: 'Mercimek Çorbası', category: 'corba', calories: 150 },
    { name: 'Domates Çorbası', category: 'corba', calories: 120 },
    { name: 'Ezogelin Çorbası', category: 'corba', calories: 140 },
    { name: 'Yayla Çorbası', category: 'corba', calories: 130 },
    { name: 'Kuru Fasulye', category: 'ana yemek', calories: 300 },
    { name: 'Pirinç Pilavı', category: 'ana yemek', calories: 250 },
    { name: 'Tavuk Sote', category: 'ana yemek', calories: 350 },
    { name: 'Izgara Köfte', category: 'ana yemek', calories: 400 },
    { name: 'Karnıyarık', category: 'ana yemek', calories: 320 },
    { name: 'Bulgur Pilavı', category: 'ana yemek', calories: 220 },
    { name: 'Makarna', category: 'ana yemek', calories: 300 },
    { name: 'Cacık', category: 'yardimci yemek', calories: 80 },
    { name: 'Mevsim Salata', category: 'yardimci yemek', calories: 50 },
    { name: 'Yoğurt', category: 'yardimci yemek', calories: 100 },
    { name: 'Sütlaç', category: 'tatli/icecek', calories: 250 },
    { name: 'Revani', category: 'tatli/icecek', calories: 300 },
    { name: 'Kemalpaşa', category: 'tatli/icecek', calories: 350 },
    { name: 'Elma', category: 'tatli/icecek', calories: 60 },
    { name: 'Portakal', category: 'tatli/icecek', calories: 50 }
];

async function seed() {
    try {
        console.log('Starting seed process...');

        // 1. Clear existing data for Jan 2026 to avoid duplicates if re-run
        await db.query(`DELETE FROM meals WHERE YEAR(date) = 2026 AND MONTH(date) = 1`);
        // Note: DELETE FROM meals should cascade to meal_dishes if FKs are set up correctly. 
        // If not, we might leave orphan records in meal_dishes, but it's acceptable for dev.
        // We won't clear dishes table to keep IDs stable if possible, or we can just expect new IDs.

        // 2. Insert Dishes (or ensure they exist)
        // For simplicity, we'll just insert them and get their IDs. 
        // In a real scenario, use INSERT IGNORE or check existence.
        // Let's just insert them all newly to be sure.
        // Actually, to avoid polluting DB endlessly, let's check first.

        const dishIds = [];
        for (const dish of dishes) {
            const [rows] = await db.query('SELECT dish_id FROM dishes WHERE name = ?', [dish.name]);
            if (rows.length > 0) {
                dishIds.push(rows[0].dish_id);
            } else {
                const [result] = await db.query('INSERT INTO dishes (name, category) VALUES (?, ?)',
                    [dish.name, dish.category]);
                dishIds.push(result.insertId);
            }
        }
        console.log(`Resolved ${dishIds.length} dish IDs.`);

        // 3. Generate Menus for Jan 2026
        const startDate = new Date('2026-01-01');
        const endDate = new Date('2026-01-31');

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay(); // 0 is Sunday

            // Skip weekends
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            // Create Lunch
            await createMeal(dateStr, 'ogle', dishIds);

            // Create Dinner
            await createMeal(dateStr, 'aksam', dishIds);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

async function createMeal(date, type, allDishIds) {
    // Pick 4 random dishes
    const selectedDishes = [];
    const shuffled = [...allDishIds].sort(() => 0.5 - Math.random());
    // Try to pick structured meal: 1 Soup, 1 Main, 1 Side/Dessert, 1 Extra
    // For simplicity, just pick 4 random distinct ones
    selectedDishes.push(...shuffled.slice(0, 4));

    // Calculate total calories (dummy logic)
    const totalCalories = 800 + Math.floor(Math.random() * 400);

    const [result] = await db.query(
        'INSERT INTO meals (date, meal_type, avg_rating, rating_count) VALUES (?, ?, 0, 0)',
        [date, type]
    );
    const mealId = result.insertId;

    // Link dishes
    let position = 1;
    for (const dishId of selectedDishes) {
        await db.query(
            'INSERT INTO meal_dishes (meal_id, dish_id, position) VALUES (?, ?, ?)',
            [mealId, dishId, position++]
        );
    }
    console.log(`Created ${type} menu for ${date}`);
}

seed();
