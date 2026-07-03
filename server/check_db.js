const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new Database(dbPath);

const info = {
    admins: db.prepare('PRAGMA table_info(admins)').all(),
    logs: db.prepare('PRAGMA table_info(logs)').all(),
    projects: db.prepare('PRAGMA table_info(projects)').all()
};

console.log(JSON.stringify(info, null, 2));
