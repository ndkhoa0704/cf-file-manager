const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');
const config = require('./config');

// Ensure storage and temp directories exist
if (!fs.existsSync(config.STORAGE_PATH)) {
  fs.mkdirSync(config.STORAGE_PATH, { recursive: true });
}

const tempPath = path.join(config.STORAGE_PATH, '.temp');
if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true });
}

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const fileRoutes = require('./routes/files');

// Cleanup old upload sessions
const UploadSession = require('./models/UploadSession');
UploadSession.cleanupOldSessions(24);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// Serve static files from Vue build in production
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
  console.log(`Storage path: ${config.STORAGE_PATH}`);
  console.log(`Chunk size: ${config.CHUNK_SIZE / 1024 / 1024}MB`);
});

