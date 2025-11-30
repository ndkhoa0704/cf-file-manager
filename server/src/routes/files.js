const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { validatePath, getUserBasePath, sanitizeFilename } = require('../utils/pathUtils');
const UploadSession = require('../models/UploadSession');
const config = require('../config');

const router = express.Router();

// Configure multer for chunk uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: config.CHUNK_SIZE + 1024 } // Chunk size + small buffer
});

// List files in directory
router.get('/list', authenticate, (req, res) => {
  try {
    const requestedPath = req.query.path || '';
    const validation = validatePath(req.user.storage_path, requestedPath);
    
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    const { fullPath } = validation;
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Not a directory' });
    }
    
    const items = fs.readdirSync(fullPath).map(name => {
      const itemPath = path.join(fullPath, name);
      const itemStats = fs.statSync(itemPath);
      return {
        name,
        isDirectory: itemStats.isDirectory(),
        size: itemStats.size,
        modified: itemStats.mtime
      };
    });
    
    // Sort: directories first, then by name
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      path: requestedPath,
      items
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create directory
router.post('/mkdir', authenticate, (req, res) => {
  try {
    const { path: dirPath, name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Directory name required' });
    }
    
    const sanitizedName = sanitizeFilename(name);
    if (!sanitizedName) {
      return res.status(400).json({ error: 'Invalid directory name' });
    }
    
    const targetPath = path.join(dirPath || '', sanitizedName);
    const validation = validatePath(req.user.storage_path, targetPath);
    
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    if (fs.existsSync(validation.fullPath)) {
      return res.status(400).json({ error: 'Directory already exists' });
    }
    
    fs.mkdirSync(validation.fullPath, { recursive: true });
    res.json({ message: 'Directory created', path: targetPath });
  } catch (error) {
    console.error('Create directory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete file or directory
router.delete('/delete', authenticate, (req, res) => {
  try {
    const { path: targetPath } = req.body;
    
    if (!targetPath) {
      return res.status(400).json({ error: 'Path required' });
    }
    
    const validation = validatePath(req.user.storage_path, targetPath);
    
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    if (!fs.existsSync(validation.fullPath)) {
      return res.status(404).json({ error: 'File or directory not found' });
    }
    
    const stats = fs.statSync(validation.fullPath);
    if (stats.isDirectory()) {
      fs.rmSync(validation.fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(validation.fullPath);
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Rename file or directory
router.post('/rename', authenticate, (req, res) => {
  try {
    const { path: currentPath, newName } = req.body;
    
    if (!currentPath || !newName) {
      return res.status(400).json({ error: 'Current path and new name required' });
    }
    
    const sanitizedName = sanitizeFilename(newName);
    if (!sanitizedName) {
      return res.status(400).json({ error: 'Invalid name' });
    }
    
    const validation = validatePath(req.user.storage_path, currentPath);
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    if (!fs.existsSync(validation.fullPath)) {
      return res.status(404).json({ error: 'File or directory not found' });
    }
    
    const newPath = path.join(path.dirname(validation.fullPath), sanitizedName);
    const newValidation = validatePath(req.user.storage_path, 
      path.join(path.dirname(currentPath), sanitizedName));
    
    if (!newValidation.valid) {
      return res.status(403).json({ error: newValidation.error });
    }
    
    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: 'A file or directory with that name already exists' });
    }
    
    fs.renameSync(validation.fullPath, newPath);
    res.json({ message: 'Renamed successfully', newPath: newValidation.relativePath });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CHUNKED UPLOAD ====================

// Initialize upload session
router.post('/upload/init', authenticate, (req, res) => {
  try {
    const { filename, totalSize, totalChunks, path: targetDir } = req.body;
    
    if (!filename || !totalSize || !totalChunks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sanitizedFilename = sanitizeFilename(filename);
    if (!sanitizedFilename) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const targetPath = path.join(targetDir || '', sanitizedFilename);
    const validation = validatePath(req.user.storage_path, targetPath);
    
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    const session = UploadSession.create(
      req.user.id,
      sanitizedFilename,
      totalSize,
      totalChunks,
      validation.fullPath
    );
    
    res.json({
      sessionId: session.id,
      chunkSize: config.CHUNK_SIZE
    });
  } catch (error) {
    console.error('Init upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload chunk
router.post('/upload/chunk', authenticate, upload.single('chunk'), (req, res) => {
  try {
    const { sessionId, chunkIndex } = req.body;
    
    if (!sessionId || chunkIndex === undefined || !req.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const session = UploadSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found' });
    }
    
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Save chunk to temp folder
    const chunkPath = path.join(session.temp_path, `chunk_${chunkIndex}`);
    fs.writeFileSync(chunkPath, req.file.buffer);
    
    // Update chunk count
    const uploadedChunks = session.uploaded_chunks + 1;
    UploadSession.updateChunkCount(sessionId, uploadedChunks);
    
    res.json({
      uploaded: uploadedChunks,
      total: session.total_chunks
    });
  } catch (error) {
    console.error('Upload chunk error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete upload - merge chunks
router.post('/upload/complete', authenticate, (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const session = UploadSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found' });
    }
    
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (session.uploaded_chunks !== session.total_chunks) {
      return res.status(400).json({ 
        error: 'Not all chunks uploaded',
        uploaded: session.uploaded_chunks,
        total: session.total_chunks
      });
    }
    
    // Ensure target directory exists
    const targetDir = path.dirname(session.target_path);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Merge chunks
    const writeStream = fs.createWriteStream(session.target_path);
    
    for (let i = 0; i < session.total_chunks; i++) {
      const chunkPath = path.join(session.temp_path, `chunk_${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }
    
    writeStream.end();
    
    // Clean up session
    UploadSession.delete(sessionId);
    
    res.json({ message: 'Upload completed', filename: session.filename });
  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel upload
router.post('/upload/cancel', authenticate, (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    const session = UploadSession.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Upload session not found' });
    }
    
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    UploadSession.delete(sessionId);
    res.json({ message: 'Upload cancelled' });
  } catch (error) {
    console.error('Cancel upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CHUNKED DOWNLOAD ====================

// Get file info for download
router.get('/download/info', authenticate, (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    const validation = validatePath(req.user.storage_path, filePath);
    
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    if (!fs.existsSync(validation.fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(validation.fullPath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot download directory' });
    }
    
    const totalChunks = Math.ceil(stats.size / config.CHUNK_SIZE);
    
    res.json({
      filename: path.basename(filePath),
      size: stats.size,
      totalChunks,
      chunkSize: config.CHUNK_SIZE
    });
  } catch (error) {
    console.error('Download info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download chunk
router.get('/download/chunk', authenticate, (req, res) => {
  try {
    const { path: filePath, chunk } = req.query;
    const chunkIndex = parseInt(chunk);
    
    if (!filePath || isNaN(chunkIndex)) {
      return res.status(400).json({ error: 'File path and chunk index required' });
    }
    
    const validation = validatePath(req.user.storage_path, filePath);
    
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    if (!fs.existsSync(validation.fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(validation.fullPath);
    const start = chunkIndex * config.CHUNK_SIZE;
    const end = Math.min(start + config.CHUNK_SIZE, stats.size);
    
    if (start >= stats.size) {
      return res.status(400).json({ error: 'Invalid chunk index' });
    }
    
    const filename = path.basename(filePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', end - start);
    res.setHeader('X-Chunk-Index', chunkIndex);
    res.setHeader('X-Total-Chunks', Math.ceil(stats.size / config.CHUNK_SIZE));
    
    const readStream = fs.createReadStream(validation.fullPath, { start, end: end - 1 });
    readStream.pipe(res);
  } catch (error) {
    console.error('Download chunk error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Simple download for small files
router.get('/download', authenticate, (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    const validation = validatePath(req.user.storage_path, filePath);
    
    if (!validation.valid) {
      return res.status(403).json({ error: validation.error });
    }
    
    if (!fs.existsSync(validation.fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(validation.fullPath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot download directory' });
    }
    
    // If file is larger than chunk size, suggest chunked download
    if (stats.size > config.CHUNK_SIZE) {
      return res.status(400).json({ 
        error: 'File too large for direct download, use chunked download',
        useChunked: true,
        size: stats.size
      });
    }
    
    const filename = path.basename(filePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', stats.size);
    
    const readStream = fs.createReadStream(validation.fullPath);
    readStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

