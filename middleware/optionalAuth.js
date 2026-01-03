const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
            if (!err) {
                req.user = user;
            }
            // Proceed even if error matches (invalid token) or no token
            // In a strict auth middleware, we would return 403 here.
            next();
        });
    } else {
        next();
    }
};

module.exports = optionalAuth;
