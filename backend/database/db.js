const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Convert SQLite-style ? placeholders and functions to PostgreSQL
function toPostgres(sql) {
  let i = 0;
  return sql
    .replace(/\?/g, () => `$${++i}`)
    .replace(/datetime\('now'\)/gi, 'NOW()')
    .replace(/MAX\(0,/gi, 'GREATEST(0,');
}

function parseRow(row) {
  if (!row) return row;
  const result = { ...row };
  for (const key of ['images', 'variants']) {
    if (result[key] && typeof result[key] === 'string') {
      try { result[key] = JSON.parse(result[key]); } catch {}
    }
  }
  if ('is_active' in result) result.is_active = Number(result.is_active) === 1 || result.is_active === true;
  if ('is_featured' in result) result.is_featured = Number(result.is_featured) === 1 || result.is_featured === true;
  return result;
}

async function allQuery(sql, params = []) {
  const { rows } = await pool.query(toPostgres(sql), params);
  return rows.map(parseRow);
}

async function getQuery(sql, params = []) {
  const rows = await allQuery(sql, params);
  return rows[0] || null;
}

async function runQuery(sql, params = []) {
  await pool.query(toPostgres(sql), params);
}

async function query(text, params = []) {
  const result = await pool.query(toPostgres(text), params);
  return { rows: result.rows.map(parseRow), rowCount: result.rowCount };
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      full_name TEXT NOT NULL, phone TEXT, address TEXT, role TEXT DEFAULT 'customer',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL, image TEXT, sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_ar TEXT,
      description_en TEXT, description_ar TEXT, price REAL NOT NULL, old_price REAL,
      material TEXT, water_resistance TEXT, size_info TEXT, category_id TEXT,
      images TEXT DEFAULT '[]', main_image TEXT, stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1, is_featured INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY, product_id TEXT,
      option_name TEXT, option_value TEXT, sku TEXT, quantity INTEGER DEFAULT 0, price_override REAL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL,
      phone2 TEXT, shipping_address TEXT, city TEXT, governorate TEXT,
      total_amount REAL NOT NULL, shipping_cost REAL DEFAULT 0,
      status TEXT DEFAULT 'pending', payment_method TEXT DEFAULT 'cash_on_delivery',
      notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT,
      product_id TEXT, product_name TEXT,
      quantity INTEGER NOT NULL, price REAL NOT NULL, size TEXT, total REAL
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY, user_id TEXT, product_id TEXT,
      quantity INTEGER DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      PRIMARY KEY (product_id, category_id)
    );
  `);
  console.log('✅ Neon PostgreSQL schema ready');
  return pool;
}

module.exports = {
  initDb,
  allQuery,
  getQuery,
  runQuery,
  parseRow,
  query,
  saveDb: () => {},
  getDb: () => pool,
  connect: () => pool.connect(),
};
