const path = require('node:path');
const config = require('../config');

/**
 * Validates that a path is within the user's sandbox
 * Prevents directory traversal attacks
 */
function validatePath(userStoragePath, requestedPath) {
  // Get the user's absolute storage path
  const userBasePath = path.resolve(config.STORAGE_PATH, userStoragePath);

  // Resolve the requested path relative to user's base path
  const fullPath = path.resolve(userBasePath, requestedPath || '');

  // Check if the resolved path is within the user's sandbox
  if (!fullPath.startsWith(userBasePath)) {
    return { valid: false, error: 'Access denied: path outside sandbox' };
  }

  return { valid: true, fullPath, relativePath: path.relative(userBasePath, fullPath) };
}

/**
 * Gets the user's base storage path
 */
function getUserBasePath(userStoragePath) {
  return path.resolve(config.STORAGE_PATH, userStoragePath);
}

/**
 * Sanitizes a filename to prevent security issues
 */
function sanitizeFilename(filename) {
  // Remove path separators and null bytes
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '');
}

module.exports = {
  validatePath,
  getUserBasePath,
  sanitizeFilename
};

