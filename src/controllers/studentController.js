const db = require('../config/database');
const { statusSuggestions } = require('../config/constants');

const studentController = {
    // Get all students with filters
    getAll: (req, res) => {
        const { status, leadSource, course, search, assignedTo } = req.query;

        let query = `
      SELECT s.*, u.fullName as assignedToName 
      FROM students s
      LEFT JOIN users u ON s.assignedTo = u.id
      WHERE 1=1
    `;
        const params = [];

        // Role-based filtering: consultant only sees their students
        if (req.user.role === 'consultant') {
            query += ' AND s.assignedTo = ?';
            params.push(req.user.id);
        } else if (assignedTo) {
            query += ' AND s.assignedTo = ?';
            params.push(assignedTo);
        }

        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }

        if (leadSource) {
            query += ' AND s.leadSource = ?';
            params.push(leadSource);
        }

        if (course) {
            query += ' AND s.interestedCourse = ?';
            params.push(course);
        }

        if (search) {
            query += ' AND (s.fullName LIKE ? OR s.parentName LIKE ? OR s.parentPhone LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ' ORDER BY s.createdAt DESC';

        const students = db.prepare(query).all(...params);

        // Add status suggestion
        students.forEach(s => {
            s.statusSuggestion = statusSuggestions[s.status] || '';
        });

        res.json(students);
    },

    // Get student by id
    getById: (req, res) => {
        const student = db.prepare(`
      SELECT s.*, u.fullName as assignedToName, c.fullName as createdByName
      FROM students s
      LEFT JOIN users u ON s.assignedTo = u.id
      LEFT JOIN users c ON s.createdBy = c.id
      WHERE s.id = ?
    `).get(req.params.id);

        if (!student) {
            return res.status(404).json({ error: 'Học sinh không tồn tại' });
        }

        // Check access permission
        if (req.user.role === 'consultant' && student.assignedTo !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền xem học sinh này' });
        }

        student.statusSuggestion = statusSuggestions[student.status] || '';

        res.json(student);
    },

    // Create new student
    create: (req, res) => {
        try {
            const {
                fullName, dateOfBirth, parentName, parentPhone, parentEmail,
                parentFacebook, englishLevel, interestedCourse, leadSource,
                status, notes, assignedTo
            } = req.body;

            if (!fullName) {
                return res.status(400).json({ error: 'Vui lòng nhập họ tên học sinh' });
            }

            const result = db.prepare(`
          INSERT INTO students (
            fullName, dateOfBirth, parentName, parentPhone, parentEmail,
            parentFacebook, englishLevel, interestedCourse, leadSource,
            status, notes, assignedTo, createdBy
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
                fullName, dateOfBirth || null, parentName || null, parentPhone || null,
                parentEmail || null, parentFacebook || null, englishLevel || null,
                interestedCourse || null, leadSource || null, status || 'Mới',
                notes || null, assignedTo || req.user.id, req.user.id
            );

            const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);

            if (newStudent) {
                newStudent.statusSuggestion = statusSuggestions[newStudent.status] || '';
                res.status(201).json(newStudent);
            } else {
                // Fallback: return basic response
                res.status(201).json({
                    id: result.lastInsertRowid,
                    fullName,
                    status: status || 'Mới',
                    statusSuggestion: statusSuggestions[status || 'Mới'] || ''
                });
            }
        } catch (error) {
            console.error('Error creating student:', error);
            res.status(500).json({ error: 'Lỗi khi tạo học sinh: ' + error.message });
        }
    },

    // Update student
    update: (req, res) => {
        const studentId = req.params.id;
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);

        if (!student) {
            return res.status(404).json({ error: 'Học sinh không tồn tại' });
        }

        // Check access permission
        if (req.user.role === 'consultant' && student.assignedTo !== req.user.id) {
            return res.status(403).json({ error: 'Không có quyền sửa học sinh này' });
        }

        const {
            fullName, dateOfBirth, parentName, parentPhone, parentEmail,
            parentFacebook, englishLevel, interestedCourse, leadSource,
            status, notes, assignedTo
        } = req.body;

        db.prepare(`
      UPDATE students SET
        fullName = ?, dateOfBirth = ?, parentName = ?, parentPhone = ?,
        parentEmail = ?, parentFacebook = ?, englishLevel = ?,
        interestedCourse = ?, leadSource = ?, status = ?, notes = ?,
        assignedTo = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
            fullName || student.fullName,
            dateOfBirth || student.dateOfBirth,
            parentName || student.parentName,
            parentPhone || student.parentPhone,
            parentEmail || student.parentEmail,
            parentFacebook || student.parentFacebook,
            englishLevel || student.englishLevel,
            interestedCourse || student.interestedCourse,
            leadSource || student.leadSource,
            status || student.status,
            notes !== undefined ? notes : student.notes,
            assignedTo || student.assignedTo,
            studentId
        );

        const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
        updated.statusSuggestion = statusSuggestions[updated.status] || '';

        res.json(updated);
    },

    // Delete student
    delete: (req, res) => {
        const studentId = req.params.id;
        const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);

        if (!student) {
            return res.status(404).json({ error: 'Học sinh không tồn tại' });
        }

        // Only admin and manager can delete
        if (req.user.role === 'consultant') {
            return res.status(403).json({ error: 'Không có quyền xóa học sinh' });
        }

        db.prepare('DELETE FROM students WHERE id = ?').run(studentId);

        res.json({ message: 'Xóa thành công' });
    }
};

module.exports = studentController;
