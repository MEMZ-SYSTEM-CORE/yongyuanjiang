import BetterSQLiteDatabase from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/forever_jiang.db');

let db: BetterSQLiteDatabase.Database;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

class DatabaseManager {
  private static instance: DatabaseManager;
  
  private constructor() {
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new BetterSQLiteDatabase(dbPath);
    this.createTables();
    this.createAdminUser();
  }
  
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }
  
  static initialize(): void {
    DatabaseManager.getInstance();
  }
  
  private createTables(): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        storage_quota INTEGER DEFAULT 10737418240,
        used_storage INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        storage_type TEXT DEFAULT 'local',
        storage_id TEXT,
        download_count INTEGER DEFAULT 0,
        is_public INTEGER DEFAULT 0,
        expires_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS storage_providers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS download_logs (
        id TEXT PRIMARY KEY,
        file_id TEXT NOT NULL,
        user_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        downloaded_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (file_id) REFERENCES files(id)
      );
      
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
      CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
      CREATE INDEX IF NOT EXISTS idx_download_logs_file_id ON download_logs(file_id);
    `);
    
    const stmt = db.prepare('INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)');
    stmt.run('max_file_size', '1073741824');
    stmt.run('default_storage_quota', '10737418240');
    stmt.run('token_secret', crypto.randomBytes(32).toString('hex'));
  }
  
  private createAdminUser(): void {
    const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
    
    if (!existingAdmin) {
      const userId = uuidv4();
      const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
      
      db.prepare(`
        INSERT INTO users (id, username, email, password, role, storage_quota)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, ADMIN_USERNAME, 'admin@example.com', hashedPassword, 'admin', 107374182400);
      
      console.log(`✅ Admin user created: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
    } else {
      const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
      db.prepare('UPDATE users SET username = ?, password = ? WHERE role = ?')
        .run(ADMIN_USERNAME, hashedPassword, 'admin');
      console.log(`✅ Admin user updated: ${ADMIN_USERNAME}`);
    }
  }
  
  getConnection(): BetterSQLiteDatabase.Database {
    return db;
  }
}

export const Database = DatabaseManager;
