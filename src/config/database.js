const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

let db = null;

// Initialize and get database instance
async function getDatabase() {
    if (db) return db;

    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    return db;
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Wrapper to make sql.js work like better-sqlite3
const dbWrapper = {
    async init() {
        await getDatabase();
    },

    exec(sql) {
        db.run(sql);
        saveDatabase();
    },

    prepare(sql) {
        return {
            run(...params) {
                db.run(sql, params);
                saveDatabase();
                // Get last insert rowid
                const result = db.exec('SELECT last_insert_rowid() as id');
                return {
                    lastInsertRowid: result[0]?.values[0]?.[0] || 0,
                    changes: db.getRowsModified()
                };
            },

            get(...params) {
                const stmt = db.prepare(sql);
                stmt.bind(params);
                if (stmt.step()) {
                    const row = stmt.getAsObject();
                    stmt.free();
                    return row;
                }
                stmt.free();
                return undefined;
            },

            all(...params) {
                const results = [];
                const stmt = db.prepare(sql);
                stmt.bind(params);
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                return results;
            }
        };
    },

    pragma(sql) {
        db.run(`PRAGMA ${sql}`);
    }
};

module.exports = dbWrapper;
