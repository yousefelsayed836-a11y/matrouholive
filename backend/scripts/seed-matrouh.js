/**
 * seed-matrouh.js - Matrouh Olive Store seed script using sql.js
 */
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { v4: uuidv4 } = require('uuid');
const csv = require('csv-parser');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'matrouholive.db');
console.log('Database:', dbPath);

const CSV_PATH = 'C:\\Users\\pc\\Downloads\\20260510131918-مطروح-اوليفي-all-products.csv';

const CATEGORIES = [
  { name_ar: 'الزيوت الطبيعيه', name_en: 'Natural Oils', slug: 'natural-oils', sort_order: 1 },
  { name_ar: 'العروض', name_en: 'Offers', slug: 'offers', sort_order: 2 },
  { name_ar: 'الاكثر مبيعا', name_en: 'Best Sellers', slug: 'best-sellers', sort_order: 3 },
  { name_ar: 'العناية بالشعر', name_en: 'Hair Care', slug: 'hair-care', sort_order: 4 },
  { name_ar: 'زيت الزيتون', name_en: 'Olive Oil', slug: 'olive-oil', sort_order: 5 },
  { name_ar: 'منتجات اخري', name_en: 'Other Products', slug: 'other-products', sort_order: 6 },
  { name_ar: 'العناية بالبشره', name_en: 'Skin Care', slug: 'skin-care', sort_order: 7 },
  { name_ar: 'التمر', name_en: 'Dates', slug: 'dates', sort_order: 8 },
  { name_ar: 'رمضان', name_en: 'Ramadan', slug: 'ramadan', sort_order: 9 },
  { name_ar: 'الطحينه', name_en: 'Tahini', slug: 'tahini', sort_order: 10 },
  { name_ar: 'منتجات عنايه بالبشره والشعر', name_en: 'Skin & Hair Care', slug: 'skin-hair-care', sort_order: 11 },
  { name_ar: 'مجموعات', name_en: 'Collections', slug: 'collections', sort_order: 12 },
];

function parseImages(str) {
  if (!str) return [];
  return str.split(/\s+/).map(u => u.trim()).filter(u => u.startsWith('http'));
}

function getVal(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return String(row[k]).trim();
    // Try stripping BOM and quotes from key names
    for (const rk of Object.keys(row)) {
      const clean = rk.replace(/^﻿|"/g, '').trim();
      if (clean === k && row[rk] !== undefined && row[rk] !== null && String(row[rk]).trim() !== '') return String(row[rk]).trim();
    }
  }
  return '';
}

// Normalize row keys: strip BOM and quotes
function normalizeRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const clean = k.replace(/^﻿|"/g, '').trim();
    out[clean] = v;
  }
  return out;
}

async function main() {
  const SQL = await initSqlJs();
  let db;
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
    console.log('Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('Created new database');
  }

  function save() { fs.writeFileSync(dbPath, Buffer.from(db.export())); }
  function run(sql, params=[]) { db.run(sql, params); }
  function all(sql, params=[]) {
    const stmt = db.prepare(sql); stmt.bind(params);
    const rows = []; while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free(); return rows;
  }
  function get(sql, params=[]) { return all(sql, params)[0] || null; }

  // Schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, full_name TEXT NOT NULL, phone TEXT, address TEXT, role TEXT DEFAULT 'customer', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_ar TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, image TEXT, sort_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_ar TEXT, description_en TEXT, description_ar TEXT, price REAL NOT NULL, old_price REAL, material TEXT, water_resistance TEXT, size_info TEXT, category_id TEXT, images TEXT DEFAULT '[]', main_image TEXT, stock INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1, is_featured INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS product_variants (id TEXT PRIMARY KEY, product_id TEXT, option_name TEXT, option_value TEXT, sku TEXT, quantity INTEGER DEFAULT 0, price_override REAL);
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, phone2 TEXT, shipping_address TEXT, city TEXT, governorate TEXT, total_amount REAL NOT NULL, shipping_cost REAL DEFAULT 0, status TEXT DEFAULT 'pending', payment_method TEXT DEFAULT 'cash_on_delivery', notes TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT, product_id TEXT, product_name TEXT, quantity INTEGER NOT NULL, price REAL NOT NULL, size TEXT, total REAL);
    CREATE TABLE IF NOT EXISTS cart_items (id TEXT PRIMARY KEY, user_id TEXT, product_id TEXT, quantity INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, product_id));
    CREATE TABLE IF NOT EXISTS product_categories (product_id TEXT NOT NULL, category_id TEXT NOT NULL, PRIMARY KEY (product_id, category_id));
  `);

  // Insert categories
  console.log('\nInserting categories...');
  const catMap = {};
  for (const cat of CATEGORIES) {
    const existing = get('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
    if (existing) { catMap[cat.name_ar] = existing.id; console.log(`  [skip] ${cat.name_ar}`); }
    else {
      const id = uuidv4();
      run('INSERT INTO categories (id, name_en, name_ar, slug, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)', [id, cat.name_en, cat.name_ar, cat.slug, cat.sort_order]);
      catMap[cat.name_ar] = id;
      console.log(`  [ok] ${cat.name_ar}`);
    }
  }
  // Spelling variants
  Object.assign(catMap, {
    'العنايه بالشعر': catMap['العناية بالشعر'],
    'العنايه بالبشره': catMap['العناية بالبشره'],
    'الا كثر مبيعا': catMap['الاكثر مبيعا'],
    'مخللات': catMap['منتجات اخري'],
    'خل التفاح': catMap['منتجات اخري'],
  });

  function resolveCat(collectionsStr) {
    if (!collectionsStr) return null;
    for (const col of collectionsStr.split(',').map(c => c.trim())) {
      const id = catMap[col]; if (id) return id;
    }
    return null;
  }

  function resolveAllCats(collectionsStr) {
    if (!collectionsStr) return [];
    const ids = [];
    for (const col of collectionsStr.split(',').map(c => c.trim())) {
      const id = catMap[col]; if (id && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }

  if (!fs.existsSync(CSV_PATH)) { console.error('CSV not found:', CSV_PATH); save(); db.close(); return; }

  const rawRows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH).pipe(csv()).on('data', r => rawRows.push(r)).on('end', resolve).on('error', reject);
  });
  const rows = rawRows.map(normalizeRow);
  console.log(`\nRead ${rows.length} CSV rows`);
  if (rows.length > 0) console.log('Sample keys:', Object.keys(rows[0]).slice(0, 5));

  const productMap = new Map();
  for (const row of rows) {
    const handle = (row['Handle'] || '').trim();
    if (!handle) continue;
    const status = (row['Status'] || 'ACTIVE').trim();
    const title = (row['Title'] || '').trim();
    const qty = parseInt(row['Quantity'] || '0') || 0;

    if (!productMap.has(handle)) {
      if (status.toUpperCase() !== 'ACTIVE') { productMap.set(handle, null); continue; }
      const description = (row['Description'] || '').trim();
      const imagesStr = (row['Images'] || '').trim();
      const collectionsStr = (row['Collections'] || '').trim();
      const regularPrice = parseFloat(row['Regular Price'] || '0') || 0;
      const salePrice = parseFloat(row['Sale Price'] || '0') || null;
      const images = parseImages(imagesStr);
      let price = regularPrice, old_price = null;
      if (salePrice && salePrice > 0 && salePrice < regularPrice) { price = salePrice; old_price = regularPrice; }
      productMap.set(handle, { handle, name_en: title, name_ar: title, description_en: description || null, description_ar: description || null, price, old_price, category_id: resolveCat(collectionsStr), all_category_ids: resolveAllCats(collectionsStr), images, main_image: images[0] || null, stock: qty, is_active: 1, is_featured: 0, variants: [] });
    } else {
      const p = productMap.get(handle);
      if (!p) continue;
      const moreImages = parseImages((row['Images'] || '').trim());
      for (const img of moreImages) { if (!p.images.includes(img)) p.images.push(img); }
      if (!p.main_image && p.images.length > 0) p.main_image = p.images[0];
      if (qty > 0) {
        const opt1Name = (row['Option1 Name'] || '').trim(); const opt1Value = (row['Option1 Value'] || '').trim();
        if (opt1Name && opt1Value) p.variants.push({ option_name: opt1Name.toLowerCase(), option_value: opt1Value, quantity: qty });
      }
    }
  }

  const products = Array.from(productMap.values()).filter(Boolean);
  console.log(`Active products: ${products.length}`);

  let created = 0, updated = 0, failed = 0, uncategorized = 0;
  for (const p of products) {
    try {
      if (!p.name_en) { console.warn(`Skipping product with empty name: ${p.handle}`); continue; }
      const existing = get('SELECT id FROM products WHERE name_en = ?', [p.name_en]);
      const productId = existing ? existing.id : uuidv4();
      run('INSERT OR REPLACE INTO products (id, name_en, name_ar, description_en, description_ar, price, old_price, images, main_image, category_id, stock, is_active, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [productId, p.name_en, p.name_ar, p.description_en, p.description_ar, p.price, p.old_price, JSON.stringify(p.images), p.main_image, p.category_id, p.stock, p.is_active, p.is_featured]);
      if (!existing && p.variants.length > 0) {
        for (const v of p.variants) run('INSERT INTO product_variants (id, product_id, option_name, option_value, quantity) VALUES (?, ?, ?, ?, ?)', [uuidv4(), productId, v.option_name, v.option_value, v.quantity]);
      }
      // Insert all categories into junction table
      run('DELETE FROM product_categories WHERE product_id = ?', [productId]);
      const allCatIds = p.all_category_ids || (p.category_id ? [p.category_id] : []);
      for (const catId of allCatIds) {
        run('INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, catId]);
      }
      existing ? updated++ : created++;
      if (!p.category_id) uncategorized++;
    } catch (err) { console.error(`Failed: ${p.handle} - ${err.message}`); failed++; }
  }

  save();
  console.log('\n=== Done! ===');
  console.log(`  Created:       ${created}`);
  console.log(`  Updated:       ${updated}`);
  console.log(`  Failed:        ${failed}`);
  console.log(`  Uncategorized: ${uncategorized}`);
  const totalProducts = get('SELECT COUNT(*) as c FROM products');
  const totalCats = get('SELECT COUNT(*) as c FROM categories');
  console.log(`  Products in DB: ${totalProducts ? totalProducts.c : 0}`);
  console.log(`  Categories in DB: ${totalCats ? totalCats.c : 0}`);
  db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
