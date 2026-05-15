const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getQuery, runQuery } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, address } = req.body;
    if (await getQuery('SELECT id FROM users WHERE email = ?', [email])) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await runQuery('INSERT INTO users (id, email, password, full_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)', [id, email, hashedPassword, full_name, phone || null, address || null]);
    const user = await getQuery('SELECT id, email, full_name, role FROM users WHERE id = ?', [id]);
    const token = jwt.sign({ id: user.id, email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
