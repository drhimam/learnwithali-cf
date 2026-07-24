// lib/db/progress.js
import { getDb } from './connection.js';
import { v4 as uuidv4 } from 'uuid';

export function getProgressByUserId(userId) {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT id, userId, worldId, levelNumber, stars, bestScore, total, coinsEarned, plays, completedAt, lastCompletedAt
    FROM user_progress
    WHERE userId = ?
  `);

  const rows = stmt.all(userId);

  return rows.map(row => ({
    id: row.id,
    userId: row.userId,
    worldId: row.worldId,
    levelNumber: row.levelNumber,
    stars: row.stars,
    bestScore: row.bestScore,
    total: row.total,
    coinsEarned: row.coinsEarned,
    plays: row.plays,
    completedAt: row.completedAt,
    lastCompletedAt: row.lastCompletedAt
  }));
}

export function getProgressEntry(userId, worldId, levelNumber) {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT id, userId, worldId, levelNumber, stars, bestScore, total, coinsEarned, plays, completedAt, lastCompletedAt
    FROM user_progress
    WHERE userId = ? AND worldId = ? AND levelNumber = ?
  `);

  const row = stmt.get(userId, worldId, levelNumber);

  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    worldId: row.worldId,
    levelNumber: row.levelNumber,
    stars: row.stars,
    bestScore: row.bestScore,
    total: row.total,
    coinsEarned: row.coinsEarned,
    plays: row.plays,
    completedAt: row.completedAt,
    lastCompletedAt: row.lastCompletedAt
  };
}

export function upsertProgress(entry) {
  const db = getDb();

  // Check if exists
  const existing = getProgressEntry(entry.userId, entry.worldId, entry.levelNumber);

  if (existing) {
    // Update existing - keep max stars and bestScore
    const newStars = Math.max(existing.stars || 0, entry.stars);
    const newBestScore = Math.max(existing.bestScore || 0, entry.bestScore);

    const stmt = db.prepare(`
      UPDATE user_progress
      SET stars = @stars,
          bestScore = @bestScore,
          total = @total,
          lastCompletedAt = @lastCompletedAt,
          plays = plays + 1
      WHERE userId = @userId AND worldId = @worldId AND levelNumber = @levelNumber
    `);

    stmt.run({
      userId: entry.userId,
      worldId: entry.worldId,
      levelNumber: entry.levelNumber,
      stars: newStars,
      bestScore: newBestScore,
      total: entry.total,
      lastCompletedAt: new Date(entry.lastCompletedAt).toISOString()
    });

    return { updated: true };
  } else {
    // Insert new
    const stmt = db.prepare(`
      INSERT INTO user_progress (
        id, userId, worldId, levelNumber, stars, bestScore, total, coinsEarned, plays, completedAt, lastCompletedAt
      ) VALUES (
        @id, @userId, @worldId, @levelNumber, @stars, @bestScore, @total, @coinsEarned, @plays, @completedAt, @lastCompletedAt
      )
    `);

    stmt.run({
      id: entry.id || uuidv4(),
      userId: entry.userId,
      worldId: entry.worldId,
      levelNumber: entry.levelNumber,
      stars: entry.stars,
      bestScore: entry.bestScore,
      total: entry.total,
      coinsEarned: entry.coinsEarned,
      plays: entry.plays || 1,
      completedAt: new Date(entry.completedAt).toISOString(),
      lastCompletedAt: new Date(entry.lastCompletedAt).toISOString()
    });

    return { inserted: true };
  }
}