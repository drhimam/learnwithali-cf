// lib/db/d1-adapter.js
// D1 database adapter for Cloudflare Pages (Edge runtime)
// Usage: createD1Adapter(env.DB) where env.DB is the D1 binding

import { v4 as uuidv4 } from 'uuid';

export function createD1Adapter(d1Binding) {
  const db = d1Binding;

  // Helper: execute a query with positional params
  async function query(sql, params = []) {
    if (params.length === 0) {
      return db.prepare(sql).all();
    }
    return db.prepare(sql).bind(...params).all();
  }

  async function queryFirst(sql, params = []) {
    if (params.length === 0) {
      return db.prepare(sql).first();
    }
    return db.prepare(sql).bind(...params).first();
  }

  async function run(sql, params = []) {
    if (params.length === 0) {
      return db.prepare(sql).run();
    }
    return db.prepare(sql).bind(...params).run();
  }

  return {
    users: {
      async create(userData) {
        const now = new Date().toISOString();
        await run(
          `INSERT INTO users (id, name, email, grade, avatar, password_hash, totalCoins, currentStreak, lastPlayed, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userData.id,
            userData.name,
            userData.email || null,
            userData.grade,
            userData.avatar,
            userData.password_hash || null,
            userData.totalCoins || 0,
            userData.currentStreak || 0,
            userData.lastPlayed ? new Date(userData.lastPlayed).toISOString() : null,
            now,
          ]
        );
        return {
          id: userData.id,
          name: userData.name,
          email: userData.email || null,
          grade: userData.grade,
          avatar: userData.avatar,
          totalCoins: userData.totalCoins || 0,
          currentStreak: userData.currentStreak || 0,
          lastPlayed: null,
          createdAt: now,
        };
      },

      async getById(userId) {
        const row = await queryFirst(
          `SELECT id, name, email, grade, avatar, totalCoins, currentStreak, lastPlayed, createdAt
           FROM users WHERE id = ?`,
          [userId]
        );
        if (!row) return null;
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          grade: row.grade,
          avatar: row.avatar,
          totalCoins: row.totalCoins,
          currentStreak: row.currentStreak,
          lastPlayed: row.lastPlayed,
          createdAt: row.createdAt,
        };
      },

      async getByEmail(email) {
        const row = await queryFirst(
          `SELECT id, name, email, grade, avatar, password_hash, totalCoins, currentStreak, lastPlayed, createdAt
           FROM users WHERE email = ?`,
          [email]
        );
        if (!row) return null;
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          grade: row.grade,
          avatar: row.avatar,
          password_hash: row.password_hash,
          totalCoins: row.totalCoins,
          currentStreak: row.currentStreak,
          lastPlayed: row.lastPlayed,
          createdAt: row.createdAt,
        };
      },

      async updateCoinsStreak(userId, coins, streak, lastPlayed) {
        const result = await run(
          `UPDATE users SET totalCoins = totalCoins + ?, currentStreak = ?, lastPlayed = ? WHERE id = ?`,
          [coins, streak, lastPlayed ? new Date(lastPlayed).toISOString() : null, userId]
        );
        return { changes: 1 };
      },

      async update(userId, updates) {
        const allowed = ['name', 'grade', 'avatar', 'totalCoins', 'currentStreak', 'lastPlayed'];
        const keys = [];
        const values = [];
        for (const key of allowed) {
          if (key in updates) {
            keys.push(`${key} = ?`);
            values.push(updates[key]);
          }
        }
        if (keys.length === 0) return { changes: 0 };
        values.push(userId);
        await run(`UPDATE users SET ${keys.join(', ')} WHERE id = ?`, values);
        return { changes: 1 };
      },
    },

    progress: {
      async getById(userId) {
        const result = await query(
          `SELECT id, userId, worldId, levelNumber, stars, bestScore, total, coinsEarned, plays, completedAt, lastCompletedAt
           FROM user_progress WHERE userId = ?`,
          [userId]
        );
        return (result.results || []).map((row) => ({
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
          lastCompletedAt: row.lastCompletedAt,
        }));
      },

      async getEntry(userId, worldId, levelNumber) {
        const row = await queryFirst(
          `SELECT id, userId, worldId, levelNumber, stars, bestScore, total, coinsEarned, plays, completedAt, lastCompletedAt
           FROM user_progress WHERE userId = ? AND worldId = ? AND levelNumber = ?`,
          [userId, worldId, levelNumber]
        );
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
          lastCompletedAt: row.lastCompletedAt,
        };
      },

      async upsert(entry) {
        const existing = await this.getEntry(entry.userId, entry.worldId, entry.levelNumber);
        const now = new Date().toISOString();

        if (existing) {
          const newStars = Math.max(existing.stars || 0, entry.stars || 0);
          const newBestScore = Math.max(existing.bestScore || 0, entry.bestScore || 0);
          await run(
            `UPDATE user_progress SET stars = ?, bestScore = ?, total = ?, lastCompletedAt = ?, plays = plays + 1
             WHERE userId = ? AND worldId = ? AND levelNumber = ?`,
            [newStars, newBestScore, entry.total || 0, now, entry.userId, entry.worldId, entry.levelNumber]
          );
          return { updated: true };
        } else {
          await run(
            `INSERT INTO user_progress (id, userId, worldId, levelNumber, stars, bestScore, total, coinsEarned, plays, completedAt, lastCompletedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              entry.id || uuidv4(),
              entry.userId,
              entry.worldId,
              entry.levelNumber,
              entry.stars || 0,
              entry.bestScore || 0,
              entry.total || 0,
              entry.coinsEarned || 0,
              entry.plays || 1,
              now,
              now,
            ]
          );
          return { inserted: true };
        }
      },
    },

    leaderboard: {
      async getTop(limit = 10) {
        const result = await query(
          `SELECT id, name, avatar, grade, totalCoins FROM users ORDER BY totalCoins DESC LIMIT ?`,
          [limit]
        );
        return (result.results || []).map((row) => ({
          id: row.id,
          name: row.name,
          avatar: row.avatar,
          grade: row.grade,
          totalCoins: row.totalCoins,
        }));
      },
    },
  };
}
