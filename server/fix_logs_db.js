const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new Database(dbPath);

console.log('Starting safe migration...');

const tables = ['logs'];
for (const table of tables) {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    const columns = info.map(c => c.name);

    if (table === 'logs') {
        if (!columns.includes('trade')) {
            db.exec('ALTER TABLE logs ADD COLUMN trade TEXT');
            console.log('Added trade column');
        }
        if (!columns.includes('car_reg')) {
            db.exec('ALTER TABLE logs ADD COLUMN car_reg TEXT');
            console.log('Added car_reg column');
        }
        if (!columns.includes('user_type')) {
            db.exec('ALTER TABLE logs ADD COLUMN user_type TEXT');
            console.log('Added user_type column');
        }
    }
}

console.log('Migration finished.');
const logsInfo = db.prepare('PRAGMA table_info(logs)').all();
console.log('Current logs columns:', logsInfo.map(c => c.name).join(', '));
process.exit(0);
