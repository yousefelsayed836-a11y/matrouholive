const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');

router.get('/', protect, (req, res) => {
  try {
    const items = allQuery(`SELECT ci.*, p.name_en, p.name_ar, p.price, p.main_image, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?`, [req.user.id]);
    res.json(items);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', protect, (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const product = getQuery('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (!product || product.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });
    const existing = getQuery('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (existing) { runQuery('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]); }
    else { runQuery('INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)', [uuidv4(), req.user.id, product_id, quantity]); }
    res.json(getQuery('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', protect, (req, res) => {
  try {
    runQuery('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [req.body.quantity, req.params.id, req.user.id]);
    res.json(getQuery('SELECT * FROM cart_items WHERE id = ?', [req.params.id]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', protect, (req, res) => {
  try { runQuery('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]); res.json({ message: 'Item removed' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
