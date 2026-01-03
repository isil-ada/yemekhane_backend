const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const requireAuth = require('../middleware/requireAuth');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/profiles');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Unique filename: user_{id}_{timestamp}.ext
        const ext = path.extname(file.originalname);
        const filename = `user_${req.user.id}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        console.log('Uploading file:', file.originalname, 'Mimetype:', file.mimetype);
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Sadece resim dosyaları yüklenebilir! (File type: ' + file.mimetype + ')'));
    }
});

// POST /api/upload-profile-picture
router.post('/upload-profile-picture', requireAuth, (req, res, next) => {
    upload.single('profile_image')(req, res, (err) => {
        if (err) {
            // Handle Multer errors (e.g. file size, file filter)
            console.error('Multer upload error:', err);
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Resim yüklenmedi.' });
        }

        const userId = req.user.id;
        const relativePath = `/uploads/profiles/${req.file.filename}`;

        // Get old picture to delete it (optional cleanup)
        const [users] = await db.query('SELECT profile_picture_path FROM users WHERE user_id = ?', [userId]);
        const oldPath = users[0].profile_picture_path;

        if (oldPath) {
            const fullOldPath = path.join(__dirname, '../public', oldPath);
            if (fs.existsSync(fullOldPath)) {
                try {
                    fs.unlinkSync(fullOldPath);
                } catch (err) {
                    console.error("Old file delete error:", err);
                }
            }
        }

        // Update DB
        await db.query('UPDATE users SET profile_picture_path = ? WHERE user_id = ?', [relativePath, userId]);

        res.json({ message: 'Profil resmi güncellendi.', profile_picture_path: relativePath });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
});

// DELETE /api/remove-profile-picture
router.delete('/remove-profile-picture', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.query('SELECT profile_picture_path FROM users WHERE user_id = ?', [userId]);
        const oldPath = users[0].profile_picture_path;

        if (oldPath) {
            const fullOldPath = path.join(__dirname, '../public', oldPath);
            if (fs.existsSync(fullOldPath)) {
                try {
                    fs.unlinkSync(fullOldPath);
                } catch (err) {
                    console.error("File delete error:", err);
                }
            }
        }

        await db.query('UPDATE users SET profile_picture_path = NULL WHERE user_id = ?', [userId]);

        res.json({ message: 'Profil resmi kaldırıldı.' });
    } catch (error) {
        console.error('Profile picture remove error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
