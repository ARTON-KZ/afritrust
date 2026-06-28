const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

function initDb(dbPath) {
  const file = dbPath || process.env.DB_PATH || path.join(__dirname, '..', 'afritrust.db');
  const db = new DatabaseSync(file);
  db.exec(`PRAGMA journal_mode = WAL`);
  db.exec(`PRAGMA foreign_keys = ON`);
  // Schemas added in Task A4.
  const stmts = {};
  const helpers = {};
  return { db, stmts, helpers };
}

module.exports = { initDb };
