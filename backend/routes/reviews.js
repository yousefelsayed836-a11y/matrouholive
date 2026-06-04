const express = require('express');
const router = express.Router();
const { allQuery, runQuery } = require('../database/db');

router.get('/', async (req, res) => {
  try {
    const reviews = await allQuery('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50');
    res.set('Cache-Control', 'public, max-age=30');
    res.json({ reviews });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, text, stars = 5 } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'name and text are required' });
    if (text.length > 500) return res.status(400).json({ error: 'text too long' });
    await runQuery('INSERT INTO reviews (name, text, stars) VALUES (?, ?, ?)', [name.trim(), text.trim(), stars]);
    const reviews = await allQuery('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50');
    res.status(201).json({ reviews });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
