// lib/db/users.js
import { getDb } from './connection.js';

export function createUser(userData) {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO users (
      id, name, grade, avatar, email, password_hash, totalCoins, currentStreak, lastPlayed, createdAt
    ) VALUES (
      @id, @name, @grade, @avatar, @email, @password_hash, @totalCoins, @currentStreak, @lastPlayed, @createdAt
    )
  `);

  stmt.run({
    id: userData.id,
    name: userData.name,
    grade: userData.grade,
    avatar: userData.avatar,
    email: userData.email || null,
    password_hash: userData.password_hash || null,
    totalCoins: userData.totalCoins || 0,
    currentStreak: userData.currentStreak || 0,
    lastPlayed: userData.lastPlayed ? new Date(userData.lastPlayed).toISOString() : null,
    createdAt: new Date(userData.createdAt || new Date()).toISOString()
  });

  // Return the full user object for API response (without password_hash)
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email || null,
    grade: userData.grade,
    avatar: userData.avatar,
    totalCoins: userData.totalCoins || 0,
    currentStreak: userData.currentStreak || 0,
    lastPlayed: null,
    createdAt: new Date().toISOString()
  };
}

export function getUserById(userId) {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT id, name, email, grade, avatar, totalCoins, currentStreak, lastPlayed, createdAt
    FROM users WHERE id = ?
  `);

  const row = stmt.get(userId);

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
    createdAt: row.createdAt
  };
}

export function getUserByEmail(email) {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT id, name, email, grade, avatar, password_hash, totalCoins, currentStreak, lastPlayed, createdAt
    FROM users WHERE email = ?
  `);

  const row = stmt.get(email);

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
    createdAt: row.createdAt
  };
}

export function updateUserCoinsAndStreak(userId, coins, streak, lastPlayed) {
  const db = getDb();

  const stmt = db.prepare(`
    UPDATE users
    SET totalCoins = totalCoins + @coins,
        currentStreak = @streak,
        lastPlayed = @lastPlayed
    WHERE id = @userId
  `);

  stmt.run({
    userId: userId,
    coins: coins,
    streak: streak,
    lastPlayed: lastPlayed ? new Date(lastPlayed).toISOString() : null
  });

  return { changes: stmt.changes };
}

export function updateUser(userId, updates) {
  const db = getDb();

  // Only allow whitelisted columns
  const allowed = ['name', 'grade', 'avatar', 'totalCoins', 'currentStreak', 'lastPlayed'];
  const filtered = {};
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key];
  }

  if (Object.keys(filtered).length === 0) return { changes: 0 };

  const setClause = Object.keys(filtered)
    .map(key => `${key} = @${key}`)
    .join(', ');

  const stmt = db.prepare(`
    UPDATE users
    SET ${setClause}
    WHERE id = @userId
  `);

  const params = { userId };
  Object.assign(params, filtered);

  stmt.run(params);

  return { changes: stmt.changes };
}
