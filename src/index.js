const express = require('express');
const cors = require('cors');
const path = require('path');
const initDatabase = require('./config/initDb');
const { studentStatuses, courses, leadSources, englishLevels, contactTypes, statusSuggestions } = require('./config/constants');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const statsRoutes = require('./routes/stats');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Get constants (public)
app.get('/api/constants', (req, res) => {
    res.json({
        statuses: studentStatuses,
        courses,
        leadSources,
        englishLevels,
        contactTypes,
        statusSuggestions
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Luna English CRM API is running' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Đã xảy ra lỗi server' });
});

// Start server after database initialization
async function startServer() {
    try {
        // Initialize database
        await initDatabase();

        // API Routes (add after database is ready)
        app.use('/api/auth', authRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/students', studentRoutes);
        app.use('/api/stats', statsRoutes);
        app.use('/api/export', exportRoutes);

        // Serve frontend for all other routes (SPA support)
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        });

        app.listen(PORT, () => {
            console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🌙 LUNA ENGLISH CRM - Backend Server           ║
  ║                                                   ║
  ║   Server running on: http://localhost:${PORT}      ║
  ║   API Endpoint: http://localhost:${PORT}/api       ║
  ║                                                   ║
  ║   Default login:                                  ║
  ║   Username: admin                                 ║
  ║   Password: admin123                              ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
