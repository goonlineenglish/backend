const db = require('../config/database');

const statsController = {
    // Get dashboard statistics
    dashboard: (req, res) => {
        // Only admin and manager can see stats
        if (req.user.role === 'consultant') {
            return res.status(403).json({ error: 'Không có quyền xem thống kê' });
        }

        // Total students
        const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;

        // Students by status
        const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM students 
      GROUP BY status
    `).all();

        // Students by course
        const byCourse = db.prepare(`
      SELECT interestedCourse as course, COUNT(*) as count 
      FROM students 
      WHERE interestedCourse IS NOT NULL
      GROUP BY interestedCourse
    `).all();

        // Students by lead source
        const bySource = db.prepare(`
      SELECT leadSource as source, COUNT(*) as count 
      FROM students 
      WHERE leadSource IS NOT NULL
      GROUP BY leadSource
    `).all();

        // New students this month
        const newThisMonth = db.prepare(`
      SELECT COUNT(*) as count FROM students 
      WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')
    `).get().count;

        // By assigned consultant
        const byConsultant = db.prepare(`
      SELECT u.fullName as consultant, COUNT(s.id) as count
      FROM users u
      LEFT JOIN students s ON s.assignedTo = u.id
      WHERE u.role IN ('consultant', 'manager')
      GROUP BY u.id
    `).all();

        // Recent students (last 5)
        const recentStudents = db.prepare(`
      SELECT s.id, s.fullName, s.status, s.createdAt, u.fullName as assignedToName
      FROM students s
      LEFT JOIN users u ON s.assignedTo = u.id
      ORDER BY s.createdAt DESC
      LIMIT 5
    `).all();

        // Students needing follow-up (with nextContactDate today or earlier)
        const needFollowUp = db.prepare(`
      SELECT s.id, s.fullName, s.status, h.nextContactDate, h.nextAction
      FROM students s
      JOIN (
        SELECT studentId, MAX(createdAt) as maxDate
        FROM contact_history
        GROUP BY studentId
      ) latest ON s.id = latest.studentId
      JOIN contact_history h ON h.studentId = latest.studentId AND h.createdAt = latest.maxDate
      WHERE h.nextContactDate IS NOT NULL AND h.nextContactDate <= date('now')
      LIMIT 10
    `).all();

        res.json({
            totalStudents,
            newThisMonth,
            byStatus,
            byCourse,
            bySource,
            byConsultant,
            recentStudents,
            needFollowUp
        });
    },

    // Get conversion statistics
    conversion: (req, res) => {
        if (req.user.role === 'consultant') {
            return res.status(403).json({ error: 'Không có quyền xem thống kê' });
        }

        const total = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
        const registered = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'Đã đăng ký'").get().count;
        const rejected = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'Từ chối'").get().count;

        const conversionRate = total > 0 ? ((registered / total) * 100).toFixed(1) : 0;
        const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0;

        // Monthly trend
        const monthlyTrend = db.prepare(`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Đã đăng ký' THEN 1 ELSE 0 END) as registered
      FROM students
      WHERE createdAt >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month
    `).all();

        res.json({
            total,
            registered,
            rejected,
            conversionRate: parseFloat(conversionRate),
            rejectionRate: parseFloat(rejectionRate),
            monthlyTrend
        });
    }
};

module.exports = statsController;
