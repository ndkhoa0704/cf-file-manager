const db = require('../database/init');
const { v4: uuidv4 } = require('uuid');
const path = require('node:path');
const fs = require('node:fs');
const config = require('../config');


function UploadSession() {
    return {
        findById: (id) => {
            const stmt = db.prepare('SELECT * FROM upload_sessions WHERE id = ?');
            return stmt.get(id);
        },
        findByUser: (userId) => {
            const stmt = db.prepare('SELECT * FROM upload_sessions WHERE user_id = ? ORDER BY created_at DESC');
            return stmt.all(userId);
        },
        create: (userId, filename, totalSize, totalChunks, targetPath) => {
            const id = uuidv4();
            const tempPath = path.join(config.STORAGE_PATH, '.temp', id);

            // Create temp directory
            if (!fs.existsSync(tempPath)) {
                fs.mkdirSync(tempPath, { recursive: true });
            }

            const stmt = db.prepare(`
                INSERT INTO upload_sessions (id, user_id, filename, total_size, total_chunks, temp_path, target_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(id, userId, filename, totalSize, totalChunks, tempPath, targetPath);
            return module.exports.findById(id);
        },

        updateChunkCount: (id, uploadedChunks) => {
            const stmt = db.prepare('UPDATE upload_sessions SET uploaded_chunks = ? WHERE id = ?');
            return stmt.run(uploadedChunks, id);
        },
        delete: (id) => {
            const session = module.exports.findById(id);
            if (session && fs.existsSync(session.temp_path)) {
                fs.rmSync(session.temp_path, { recursive: true, force: true });
            }

            const stmt = db.prepare('DELETE FROM upload_sessions WHERE id = ?');
            return stmt.run(id);
        },
        cleanupOldSessions: (hoursOld = 24) => {
            const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();
            const stmt = db.prepare('SELECT * FROM upload_sessions WHERE created_at < ?');
            const oldSessions = stmt.all(cutoff);

            for (const session of oldSessions) {
                module.exports.delete(session.id);
            }

            return oldSessions.length;
        }
    }
}

module.exports = UploadSession();

