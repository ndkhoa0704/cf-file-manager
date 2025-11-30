const express = require('express');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const users = User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if username exists
    const existing = User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const user = await User.create(username, password, role);
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    
    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    User.delete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', authenticate, requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const user = User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    User.updatePassword(userId, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

