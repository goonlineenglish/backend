const db = require('../config/database');

const historyController = {
    // Get contact history for a student
    getByStudent: (req, res) => {
        const studentId = req.params.studentId;

        // Check if student exists and user has access
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Học sinh không tồn tại' });
        }

        if (req.user.role === 'consultant' && student.assignedTo !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền xem lịch sử này' });
        }

        const history = db.prepare(`
      SELECT h.*, u.fullName as userName
      FROM contact_history h
      LEFT JOIN users u ON h.userId = u.id
      WHERE h.studentId = ?
      ORDER BY h.createdAt DESC
    `).all(studentId);

        res.json(history);
    },

    // Add contact history
    create: (req, res) => {
        const studentId = req.params.studentId;
        const { contactType, content, nextAction, nextContactDate } = req.body;

        // Check if student exists and user has access
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Học sinh không tồn tại' });
        }

        if (req.user.role === 'consultant' && student.assignedTo !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền thêm lịch sử này' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Vui lòng nhập nội dung tư vấn' });
        }

        const result = db.prepare(`
      INSERT INTO contact_history (studentId, userId, contactType, content, nextAction, nextContactDate)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(studentId, req.user.id, contactType || 'Gọi điện', content, nextAction || null, nextContactDate || null);

        const newHistory = db.prepare(`
      SELECT h.*, u.fullName as userName
      FROM contact_history h
      LEFT JOIN users u ON h.userId = u.id
      WHERE h.id = ?
    `).get(result.lastInsertRowid);

        res.status(201).json(newHistory);
    },

    // Delete contact history
    delete: (req, res) => {
        const historyId = req.params.id;

        // Only admin and manager can delete
        if (req.user.role === 'consultant') {
            return res.status(403).json({ error: 'Không có quyền xóa lịch sử' });
        }

        const result = db.prepare('DELETE FROM contact_history WHERE id = ?').run(historyId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Lịch sử không tồn tại' });
        }

        res.json({ message: 'Xóa thành công' });
    }
};

module.exports = historyController;
