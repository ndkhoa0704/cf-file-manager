const db = require('../database/init');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const config = require('../config');

class User {
  static findById(id) {
    const stmt = db.prepare('SELECT id, username, role, storage_path, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findAll() {
    const stmt = db.prepare('SELECT id, username, role, storage_path, created_at FROM users ORDER BY created_at DESC');
    return stmt.all();
  }

  static async create(username, password, role = 'user') {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create unique storage path for user
    const storagePath = path.join(username);
    const fullStoragePath = path.join(config.STORAGE_PATH, storagePath);
    
    // Ensure storage directory exists
    if (!fs.existsSync(fullStoragePath)) {
      fs.mkdirSync(fullStoragePath, { recursive: true });
    }
    
    const stmt = db.prepare(
      'INSERT INTO users (username, password, role, storage_path) VALUES (?, ?, ?, ?)'
    );
    
    const result = stmt.run(username, hashedPassword, role, storagePath);
    return this.findById(result.lastInsertRowid);
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  static delete(id) {
    const user = this.findById(id);
    if (user) {
      // Delete user's storage folder
      const fullStoragePath = path.join(config.STORAGE_PATH, user.storage_path);
      if (fs.existsSync(fullStoragePath)) {
        fs.rmSync(fullStoragePath, { recursive: true, force: true });
      }
    }
    
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }

  static updatePassword(id, newPassword) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(hashedPassword, id);
  }
}

module.exports = User;

