const db = require('./database');
const bcrypt = require('bcryptjs');

// Create tables
const initDatabase = async () => {
  // Initialize database connection
  await db.init();

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'consultant',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      dateOfBirth DATE,
      parentName TEXT,
      parentPhone TEXT,
      parentEmail TEXT,
      parentFacebook TEXT,
      englishLevel TEXT,
      interestedCourse TEXT,
      leadSource TEXT,
      status TEXT DEFAULT 'Mới',
      testResult TEXT,
      assignedClass TEXT,
      notes TEXT,
      assignedTo INTEGER,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignedTo) REFERENCES users(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    )
  `);

  // Contact History table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      contactType TEXT,
      content TEXT,
      nextAction TEXT,
      nextContactDate DATE,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, fullName, email, role) 
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'Administrator', 'admin@lunaenglish.com', 'admin');
    console.log('Default admin user created: admin / admin123');
  }

  console.log('Database initialized successfully!');
};

module.exports = initDatabase;
