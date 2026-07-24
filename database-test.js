#!/usr/bin/env js
import { getDb } from './lib/db/connection.js';
import { createTables } from './lib/db/schema.js';

// Test the database layer
async function testDatabase() {
  try {
    console.log('Testing database connection...');

    // Initialize tables
    await createTables();
    console.log('✓ Tables created or verified');

    // Get db instance
    const db = getDb();
    console.log('✓ Database connected');

    // Test a basic operation
    const stmt = db.prepare('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
    stmt.run('test1', 'Test User');
    console.log('✓ Basic table operation works');

    // Query
    const result = stmt.all();
    console.log('✓ Query works:', result);

    console.log('✓ All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();