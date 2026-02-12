import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import BetterSQLite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../data/forever_jiang.db');

function createAdmin() {
  const db = new BetterSQLite3(dbPath);
  
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123456';
  
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  
  if (existingAdmin) {
    console.log('Admin user already exists!');
    const stmt = db.prepare('UPDATE users SET username = ?, password = ? WHERE role = ?');
    stmt.run(username, bcrypt.hashSync(password, 10), 'admin');
    console.log(`Updated admin: ${username}/${password}`);
  } else {
    const userId = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.prepare(`
      INSERT INTO users (id, username, email, password, role, storage_quota)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, username, hashedPassword, 'admin', 'admin', 107374182400);
    
    console.log(`Created admin user: ${username}/${password}`);
  }
  
  db.close();
}

createAdmin();
