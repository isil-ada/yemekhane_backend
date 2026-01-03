const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic Test Route
app.get('/', (req, res) => {
    res.send({ message: 'Yemekhane App API is running' });
});

// Routes will be imported here
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Serve static files from 'public' directory
// Serve static files from 'public' directory
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api', menuRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api', feedbackRoutes); // mounted at /api
app.use('/api/complaints', complaintRoutes);
app.use('/api', uploadRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
