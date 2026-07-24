// lib/db/leaderboard.js
import { getDb } from './connection.js';

export function getLeaderboard(limit = 10) {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT id, name, avatar, grade, totalCoins
    FROM users
    ORDER BY totalCoins DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit);

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    grade: row.grade,
    totalCoins: row.totalCoins
  }));
}