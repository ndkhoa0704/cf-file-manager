const path = require('node:path');

module.exports = {
  PORT: process.env.PORT || 3123,
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: '24h',
  
  // Database
  DB_PATH: path.join(__dirname, '../../data/database.sqlite'),
  
  // File storage
  STORAGE_PATH: path.join(__dirname, '../../storage'),
  
  // Chunk size for upload/download (100MB)
  CHUNK_SIZE: 50 * 1024 * 1024,
  
  // Max file size (5GB)
  MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024
};

