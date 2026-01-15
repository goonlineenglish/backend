const bcrypt = require('bcryptjs');
const db = require('../config/database');

const userController = {
    // Get all users (admin only)
    getAll: (req, res) => {
        const users = db.prepare(`
      SELECT id, username, fullName, email, role, createdAt 
      FROM users 
      ORDER BY createdAt DESC
    `).all();
        res.json(users);
    },

    // Get user by id
    getById: (req, res) => {
        const user = db.prepare(`
      SELECT id, username, fullName, email, role, createdAt 
      FROM users WHERE id = ?
    `).get(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User không tồn tại' });
        }
        res.json(user);
    },

    // Create new user (admin only)
    create: (req, res) => {
        const { username, password, fullName, email, role } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }

        // Check if username exists
        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(400).json({ error: 'Username đã tồn tại' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const result = db.prepare(`
      INSERT INTO users (username, password, fullName, email, role) 
      VALUES (?, ?, ?, ?, ?)
    `).run(username, hashedPassword, fullName, email || null, role || 'consultant');

        res.status(201).json({
            id: result.lastInsertRowid,
            username,
            fullName,
            email,
            role: role || 'consultant'
        });
    },

    // Update user (admin only)
    update: (req, res) => {
        const { fullName, email, role, password } = req.body;
        const userId = req.params.id;

        const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User không tồn tại' });
        }

        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            db.prepare(`
        UPDATE users SET fullName = ?, email = ?, role = ?, password = ?
        WHERE id = ?
      `).run(fullName, email, role, hashedPassword, userId);
        } else {
            db.prepare(`
        UPDATE users SET fullName = ?, email = ?, role = ?
        WHERE id = ?
      `).run(fullName, email, role, userId);
        }

        res.json({ message: 'Cập nhật thành công' });
    },

    // Delete user (admin only)
    delete: (req, res) => {
        const userId = req.params.id;

        // Prevent deleting yourself
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Không thể xóa chính mình' });
        }

        const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User không tồn tại' });
        }

        res.json({ message: 'Xóa thành công' });
    }
};

module.exports = userController;
