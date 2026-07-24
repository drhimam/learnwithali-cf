// lib/db/index.js
import { createTables } from './schema.js';
import * as users from './users.js';
import * as progress from './progress.js';
import * as leaderboard from './leaderboard.js';
import { getDb } from './connection.js';

// Initialize database on first import
createTables();

const db = {
  // Expose raw connection for edge cases
  getDb,

  // User operations
  users: {
    create: users.createUser,
    getById: users.getUserById,
    getByEmail: users.getUserByEmail,
    updateCoinsStreak: users.updateUserCoinsAndStreak,
    update: users.updateUser,
  },

  // Progress operations
  progress: {
    getById: progress.getProgressByUserId,
    getEntry: progress.getProgressEntry,
    upsert: progress.upsertProgress,
  },

  // Leaderboard operations
  leaderboard: {
    getTop: leaderboard.getLeaderboard,
  }
};

export default db;
