const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database/db');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, async (req, res) => {
  try { res.json(await allQuery('SELECT id, email, full_name, phone, role, created_at FROM users ORDER BY created_at DESC')); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/profile', protect, async (req, res) => {
  try { res.json(await getQuery('SELECT id, email, full_name, phone, address, role FROM users WHERE id = ?', [req.user.id])); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { full_name, phone, address } = req.body;
    await runQuery('UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?', [full_name, phone, address, req.user.id]);
    res.json(await getQuery('SELECT id, email, full_name, phone, address, role FROM users WHERE id = ?', [req.user.id]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
