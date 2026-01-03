const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Geçersiz token.' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Yetkilendirme gerekli.' });
    }
};

module.exports = requireAuth;
