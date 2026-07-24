// lib/db/schema.js
const { getDb } = require('./connection.js');

const schemaVersion = 2;

function createTables() {
  const db = getDb();

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      avatar TEXT NOT NULL,
      totalCoins INTEGER DEFAULT 0,
      currentStreak INTEGER DEFAULT 0,
      lastPlayed TEXT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(id)
    )
  `);

  // User progress table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      worldId TEXT NOT NULL,
      levelNumber INTEGER NOT NULL,
      stars INTEGER DEFAULT 0,
      bestScore INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      coinsEarned INTEGER DEFAULT 0,
      plays INTEGER DEFAULT 1,
      completedAt TEXT NOT NULL,
      lastCompletedAt TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id),
      UNIQUE(userId, worldId, levelNumber)
    )
  `);

  // Database version tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS db_version (
      version INTEGER PRIMARY KEY
    )
  `);

  // Initialize version if not set
  const result = db.prepare(`SELECT COUNT(*) as count FROM db_version`).get();
  if (result.count === 0) {
    db.prepare(`INSERT INTO db_version (version) VALUES (?)`).run(schemaVersion);
  }

  // Migration: add auth columns
  const currentVersion = db.prepare(`SELECT MAX(version) as version FROM db_version`).get();
  if (currentVersion.version < 2) {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
    } catch (_) { /* column may already exist */ }
    try {
      db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
    } catch (_) { /* column may already exist */ }
    try {
      db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    } catch (_) { /* index may already exist */ }
    db.prepare(`UPDATE db_version SET version = ?`).run(schemaVersion);
  }
}

module.exports = { createTables };