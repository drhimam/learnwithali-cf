// lib/db/index.js
// Environment-aware DB adapter: D1 on Cloudflare, better-sqlite3 locally

let _db = null;

export async function getDb() {
  if (_db) return _db;

  // Cloudflare Pages / Edge runtime: use D1 via getRequestContext
  // D1 bindings are NOT in process.env — they come from the Cloudflare request context
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const ctx = getRequestContext();
    if (ctx?.env?.DB) {
      const { createD1Adapter } = await import('./d1-adapter.js');
      _db = createD1Adapter(ctx.env.DB);
      return _db;
    }
  } catch (_) {
    // Not in Cloudflare edge runtime — fall through to local SQLite
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
