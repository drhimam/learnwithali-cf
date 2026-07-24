const { getDb } = require('./lib/db/connection.js');
const { createTables } = require('./lib/db/schema.js');

// Test the database layer
function testDatabase() {
  try {
    console.log('Testing database connection...');

    // Initialize tables
    createTables();
    console.log('✓ Tables created or verified');

    // Get db instance
    const db = getDb();
    console.log('✓ Database connected');

    // Test a basic operation
    db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
    const stmt = db.prepare('INSERT INTO test (name) VALUES (?)');
    stmt.run('Test User');
    console.log('✓ Basic table operation works');

    // Query
    const result = db.prepare('SELECT * FROM test').all();
    console.log('✓ Query works:', result);

    console.log('✓ All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();