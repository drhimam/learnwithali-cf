// lib/db/connection.js
import Database from 'better-sqlite3';

const DB_PATH = process.env.SQLITE_PATH || './data/learnwithali.db';

// Ensure data directory exists
import { mkdirSync } from 'fs';
import { dirname } from 'path';
const dbDir = dirname(DB_PATH);
if (!global.__dirname) {
  // In Node.js environment
  mkdirSync(dbDir, { recursive: true });
}

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
  }
  return db;
}