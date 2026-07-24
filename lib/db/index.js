// lib/db/index.js
// Environment-aware DB adapter: D1 on Cloudflare, better-sqlite3 locally

let _db = null;

export async function getDb() {
  if (_db) return _db;

  // Cloudflare Pages / Edge runtime: use D1
  if (typeof process !== 'undefined' && process.env.DB) {
    const { createD1Adapter } = await import('./d1-adapter.js');
    _db = createD1Adapter(process.env.DB);
    return _db;
  }

  // Local Node.js: use better-sqlite3
  const { createTables } = await import('./schema.js');
  createTables();

  const users = await import('./users.js');
  const progress = await import('./progress.js');
  const leaderboard = await import('./leaderboard.js');

  _db = {
    users: {
      create: users.createUser,
      getById: users.getUserById,
      getByEmail: users.getUserByEmail,
      updateCoinsStreak: users.updateUserCoinsAndStreak,
      update: users.updateUser,
    },
    progress: {
      getById: progress.getProgressByUserId,
      getEntry: progress.getProgressEntry,
      upsert: progress.upsertProgress,
    },
    leaderboard: {
      getTop: leaderboard.getLeaderboard,
    },
  };

  return _db;
}
