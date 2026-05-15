const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery, parseRow } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

function safeParseJSON(str, fallback) {
  if (!str) return fallback;
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

async function getVariants(productId) {
  return allQuery('SELECT * FROM product_variants WHERE product_id = ? ORDER BY option_value', [productId]);
}

async function getFullProduct(id) {
  const p = await getQuery(`SELECT p.*, c.name_en as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [id]);
  if (!p) return null;
  return { ...parseRow(p), images: safeParseJSON(p.images, []), variants: await getVariants(id) };
}

async function resolveCategoryId(categoryId) {
  if (!categoryId) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const hexRegex = /^[0-9a-f]{32}$/i;
  if (uuidRegex.test(categoryId) || hexRegex.test(categoryId)) return categoryId;
  const cat = await getQuery('SELECT id FROM categories WHERE slug = ? OR name_ar = ? OR name_en LIKE ? LIMIT 1', [categoryId.toLowerCase(), categoryId, categoryId]);
  return cat ? cat.id : null;
}

async function insertVariants(productId, variants) {
  for (const v of variants) {
    await runQuery(`INSERT INTO product_variants (id, product_id, option_name, option_value, sku, quantity, price_override) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), productId, v.option_name || 'default', v.option_value || 'default', v.sku || null, v.quantity || 0, v.price_override || null]);
  }
}

router.get('/', async (req, res) => {
  try {
    const { collection, is_active, search, page = 1, limit = 1000 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = '1=1'; const params = [];
    if (collection) {
      where += ' AND p.id IN (SELECT pc.product_id FROM product_categories pc JOIN categories cc ON pc.category_id = cc.id WHERE cc.slug = ?)';
      params.push(collection);
    }
    if (is_active !== undefined) { where += ' AND p.is_active = ?'; params.push(is_active === 'true' ? 1 : 0); }
    if (search) { where += ' AND (p.name_en ILIKE ? OR p.name_ar ILIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    const products = await allQuery(`SELECT p.*, c.name_en as category_name, c.name_ar as category_name_ar, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]);
    const totalRow = await getQuery(`SELECT COUNT(*) as count FROM products p WHERE ${where}`, params);
    const total = totalRow ? parseInt(totalRow.count) : 0;
    const parsed = await Promise.all(products.map(async p => ({ ...parseRow(p), images: safeParseJSON(p.images, []), variants: await getVariants(p.id) })));
    res.json({ success: true, products: parsed, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { console.error('Get products error:', error); res.status(500).json({ error: 'Failed to fetch products', details: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const p = await getQuery(`SELECT p.*, c.id as category_id, c.name_en as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`, [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, product: { ...parseRow(p), images: safeParseJSON(p.images, []), variants: await getVariants(p.id) } });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch product' }); }
});

router.post('/', async (req, res) => {
  try {
    const { name_en, name_ar, description_en, description_ar, price, old_price, images, main_image, category_id, material, water_resistance, size_info, stock, is_active, is_featured, variants } = req.body;
    const resolvedCategoryId = await resolveCategoryId(category_id);
    const id = uuidv4();
    const imagesArr = Array.isArray(images) ? images : (images ? [images] : []);
    const mainImg = main_image || imagesArr[0] || null;
    await runQuery(`INSERT INTO products (id, name_en, name_ar, description_en, description_ar, price, old_price, images, main_image, category_id, material, water_resistance, size_info, stock, is_active, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name_en, name_ar || name_en, description_en || null, description_ar || null, price, old_price || null, JSON.stringify(imagesArr), mainImg, resolvedCategoryId, material || null, water_resistance || null, size_info || null, stock || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1, is_featured ? 1 : 0]);
    if (variants && Array.isArray(variants)) await insertVariants(id, variants);
    res.json({ success: true, product: await getFullProduct(id) });
  } catch (error) { console.error('Add product error:', error); res.status(500).json({ error: 'Failed to add product', details: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!await getQuery('SELECT id FROM products WHERE id = ?', [id])) return res.status(404).json({ error: 'Product not found' });
    const { name_en, name_ar, description_en, description_ar, price, old_price, images, main_image, category_id, material, water_resistance, size_info, stock, is_active, is_featured, variants } = req.body;
    const fields = []; const vals = [];
    if (name_en !== undefined) { fields.push('name_en = ?'); vals.push(name_en); }
    if (name_ar !== undefined) { fields.push('name_ar = ?'); vals.push(name_ar); }
    if (description_en !== undefined) { fields.push('description_en = ?'); vals.push(description_en); }
    if (description_ar !== undefined) { fields.push('description_ar = ?'); vals.push(description_ar); }
    if (price !== undefined) { fields.push('price = ?'); vals.push(price); }
    if ('old_price' in req.body) { fields.push('old_price = ?'); vals.push(old_price || null); }
    if (images !== undefined) { fields.push('images = ?'); vals.push(JSON.stringify(Array.isArray(images) ? images : [images])); }
    if (main_image !== undefined) { fields.push('main_image = ?'); vals.push(main_image); }
    if (category_id !== undefined) { fields.push('category_id = ?'); vals.push(await resolveCategoryId(category_id)); }
    if (material !== undefined) { fields.push('material = ?'); vals.push(material); }
    if (water_resistance !== undefined) { fields.push('water_resistance = ?'); vals.push(water_resistance); }
    if (size_info !== undefined) { fields.push('size_info = ?'); vals.push(size_info); }
    if (stock !== undefined) { fields.push('stock = ?'); vals.push(Number(stock)); }
    if (is_active !== undefined) { fields.push('is_active = ?'); vals.push(is_active ? 1 : 0); }
    if (is_featured !== undefined) { fields.push('is_featured = ?'); vals.push(is_featured ? 1 : 0); }
    fields.push('updated_at = NOW()'); vals.push(id);
    await runQuery(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, vals);
    if (variants && Array.isArray(variants)) { await runQuery('DELETE FROM product_variants WHERE product_id = ?', [id]); await insertVariants(id, variants); }
    res.json({ success: true, product: await getFullProduct(id) });
  } catch (error) { console.error('Update product error:', error); res.status(500).json({ error: 'Failed to update product', details: error.message }); }
});

router.patch('/:id/toggle', async (req, res) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ error: 'is_active is required' });
    await runQuery('UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?', [is_active ? 1 : 0, req.params.id]);
    const p = await getQuery('SELECT id, name_en, is_active FROM products WHERE id = ?', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, product: parseRow(p) });
  } catch (error) { res.status(500).json({ error: 'Failed to toggle product status' }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!await getQuery('SELECT id FROM products WHERE id = ?', [req.params.id])) return res.status(404).json({ error: 'Product not found' });
    await runQuery('DELETE FROM product_variants WHERE product_id = ?', [req.params.id]);
    await runQuery('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete product' }); }
});

module.exports = router;
