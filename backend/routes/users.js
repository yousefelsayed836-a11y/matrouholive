const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database/db');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, (req, res) => {
  try { res.json(allQuery('SELECT id, email, full_name, phone, role, created_at FROM users ORDER BY created_at DESC')); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/profile', protect, (req, res) => {
  try { res.json(getQuery('SELECT id, email, full_name, phone, address, role FROM users WHERE id = ?', [req.user.id])); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/profile', protect, (req, res) => {
  try {
    const { full_name, phone, address } = req.body;
    runQuery('UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?', [full_name, phone, address, req.user.id]);
    res.json(getQuery('SELECT id, email, full_name, phone, address, role FROM users WHERE id = ?', [req.user.id]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
