const express = require('express');
const router = express.Router();
const { allQuery, getQuery, parseRow } = require('../database/db');

function safeParseJSON(str, fallback) { if (!str) return fallback; try { return JSON.parse(str); } catch { return fallback; } }

router.get('/', async (req, res) => {
  try {
    const cats = await allQuery(`SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name_ar ASC`);
    res.json(cats.map(c => parseRow(c)));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const cat = await getQuery('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const products = await allQuery(`SELECT p.*, c.name_en as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.category_id = ? AND p.is_active = 1 ORDER BY p.created_at DESC`, [cat.id]);
    res.json({ category: parseRow(cat), products: products.map(p => ({ ...parseRow(p), images: safeParseJSON(p.images, []) })) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
