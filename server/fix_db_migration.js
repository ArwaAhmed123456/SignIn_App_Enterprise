const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'attendance.db');
const db = new Database(dbPath);

console.log('Starting DB fix for logs table...');

try {
    // 1. Check current columns
    const columns = db.prepare('PRAGMA table_info(logs)').all();
    console.log('Current logs columns:', columns.map(c => `${c.name} (notnull: ${c.notnull})`).join(', '));

    // 2. Create temp table with correct schema
    db.exec(`
        CREATE TABLE logs_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            trade TEXT,
            car_reg TEXT,
            user_type TEXT,
            time_in TEXT NOT NULL,
            time_out TEXT, -- Removed NOT NULL if it was there
            hours REAL,
            reason TEXT,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    `);

    // 3. Copy data
    db.exec('INSERT INTO logs_new SELECT * FROM logs');

    // 4. Swap tables
    db.exec('DROP TABLE logs');
    db.exec('ALTER TABLE logs_new RENAME TO logs');

    console.log('Successfully fixed logs table schema.');

    // Final check
    const newColumns = db.prepare('PRAGMA table_info(logs)').all();
    console.log('New logs columns:', newColumns.map(c => `${c.name} (notnull: ${c.notnull})`).join(', '));

} catch (err) {
    console.error('Error fixing DB:', err.message);
} finally {
    db.close();
}
