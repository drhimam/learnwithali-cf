-- D1 Migration: Initial schema for LearnWithAli
-- Run with: wrangler d1 migrations apply learnwithali-db

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  grade INTEGER NOT NULL,
  avatar TEXT NOT NULL,
  totalCoins INTEGER DEFAULT 0,
  currentStreak INTEGER DEFAULT 0,
  lastPlayed TEXT NULL,
  createdAt TEXT NOT NULL
);

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
);

CREATE TABLE IF NOT EXISTS db_version (
  version INTEGER PRIMARY KEY
);

INSERT OR IGNORE INTO db_version (version) VALUES (2);
