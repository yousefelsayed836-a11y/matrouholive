const express = require('express');
const router = express.Router();
const { allQuery, getQuery, parseRow } = require('../database/db');

router.get('/', (req, res) => {
  try {
    const cats = allQuery(`SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name_ar ASC`);
    res.json(cats.map(c => parseRow(c)));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:slug', (req, res) => {
  try {
    const cat = getQuery('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const products = allQuery(`SELECT p.*, c.name_en as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.category_id = ? AND p.is_active = 1 ORDER BY p.created_at DESC`, [cat.id]);
    res.json({ category: parseRow(cat), products: products.map(p => ({ ...parseRow(p), images: safeParseJSON(p.images, []) })) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

function safeParseJSON(str, fallback) { if (!str) return fallback; try { return JSON.parse(str); } catch { return fallback; } }
module.exports = router;
