const db = require('./config/db');

async function inspect() {
    try {
        const [rows] = await db.query('SELECT DISTINCT category FROM dishes');
        console.log('Existing categories:', rows.map(r => r.category));

        // Also try to describe table if possible (MySQL specific)
        const [desc] = await db.query('DESCRIBE dishes');
        console.log('Table structure:', desc);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspect();
