const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'chat.db');
const SAVE_INTERVAL_MS = 5000;

async function initDatabase() {
  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('Loaded existing database from', DB_PATH);
  } else {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new SQL.Database();
    console.log('Created new database');
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      message TEXT,
      image TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at)
  `);

  let saveTimeout = null;
  function scheduleSave() {
    if (saveTimeout) return;
    saveTimeout = setTimeout(() => {
      saveTimeout = null;
      try {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
      } catch (err) {
        console.error('Error saving database:', err.message);
      }
    }, SAVE_INTERVAL_MS);
  }

  const originalRun = db.run.bind(db);
  db.run = function (...args) {
    const result = originalRun(...args);
    scheduleSave();
    return result;
  };

  process.on('exit', () => {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
      console.log('Database saved on exit');
    } catch (e) {}
  });

  return db;
}

module.exports = initDatabase;
