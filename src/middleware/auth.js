const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/constants');
const db = require('../config/database');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = db.prepare('SELECT id, username, fullName, email, role FROM users WHERE id = ?').get(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User không tồn tại' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
};

// Check if user has required role
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Không có quyền truy cập' });
        }

        next();
    };
};

module.exports = { authMiddleware, requireRole };
