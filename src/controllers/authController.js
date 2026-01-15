const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { jwtSecret, jwtExpiresIn } = require('../config/constants');

const authController = {
    // Login
    login: (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập username và password' });
        }

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

        if (!user) {
            return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: jwtExpiresIn });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    },

    // Get current user
    me: (req, res) => {
        res.json({ user: req.user });
    }
};

module.exports = authController;
