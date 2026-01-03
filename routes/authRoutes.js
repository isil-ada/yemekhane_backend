const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// Register Endpoint
router.post('/register', async (req, res) => {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
    }

    try {
        // Check if user or username already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Bu e-posta veya kullanıcı adı ile kayıtlı bir kullanıcı zaten var.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)',
            [name, username, email, passwordHash]
        );

        res.status(201).json({ message: 'Kayıt başarılı! Giriş yapabilirsiniz.', userId: result.insertId });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Login Endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Lütfen e-posta ve şifrenizi girin.' });
    }

    try {
        // Find user
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Giriş başarılı.',
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                profile_picture: user.profile_picture_path
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Change Password Endpoint
router.post('/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Mevcut şifre ve yeni şifre gereklidir.' });
    }

    try {
        const userId = req.user.id;

        // Get user's current password hash
        const [users] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [userId]);
        const user = users[0];

        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mevcut şifre yanlış.' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newPasswordHash, userId]);

        res.json({ message: 'Şifreniz başarıyla değiştirildi.' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Update Profile Endpoint
router.put('/update-profile', requireAuth, async (req, res) => {
    const { name, username, email } = req.body;

    if (!name || !username || !email) {
        return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
    }

    try {
        const userId = req.user.id;

        // Check if new email or username is already taken by ANOTHER user
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE (email = ? OR username = ?) AND user_id != ?',
            [email, username, userId]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Bu e-posta veya kullanıcı adı zaten kullanımda.' });
        }

        // Update user
        await db.query(
            'UPDATE users SET name = ?, username = ?, email = ? WHERE user_id = ?',
            [name, username, email, userId]
        );

        // Return updated user info
        res.json({
            message: 'Profil güncellendi.',
            user: {
                id: userId,
                name,
                username,
                email
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
