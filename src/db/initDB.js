import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db=null;

// Helper for enabling foreign key support after DB open
async function enableForeignKeys(database) {
  await database.execute('PRAGMA foreign_keys = ON'); // the word database is simply a local variable (a placeholder name for whatever object you pass in). 
}


export async function getDB() {
  if (db) return db;

  db = await sqlite.createConnection('appdb', false, 'no-encryption', 1);
  await db.open();

  await enableForeignKeys(db);

  // Create tables and virtual tables individually
  await db.execute(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT DEFAULT 'Developer',
      avatar_url TEXT,
      quote TEXT DEFAULT 'East or West, You are the best' CHECK (length(quote) <= 100),
      theme TEXT DEFAULT 'light',
      streak INTEGER DEFAULT 0
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER DEFAULT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_completed INTEGER DEFAULT 0,
      due_date DATETIME,
      priority TEXT NOT NULL,
      recurrence_rule_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      category TEXT DEFAULT 'Reminder',  -- personal, grocery, meeting, work, family, other
      vector_embedding BLOB,
      FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (recurrence_rule_id) REFERENCES recurrence_rules(id) ON DELETE SET NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS recurrence_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      frequency TEXT NOT NULL,
      interval INTEGER DEFAULT 1,
      byweekday TEXT,
      until DATETIME,
      count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      related_id INTEGER,
      read_status INTEGER DEFAULT 0,
      scheduled_for DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`    CREATE TABLE IF NOT EXISTS task_embeddings (
      id INTEGER PRIMARY KEY,
      embedding TEXT,
      type TEXT
    )
  `);

  return db;
}




