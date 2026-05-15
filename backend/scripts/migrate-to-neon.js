/**
 * Migrate data from local SQLite to Neon PostgreSQL
 * Run: DATABASE_URL="your-neon-url" node scripts/migrate-to-neon.js
 */
const initSqlJs = require('sql.js');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'data', 'matrouholive.db');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Add it to .env or pass as env var.');
    process.exit(1);
  }

  console.log('📦 Loading SQLite database...');
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const sqlite = new SQL.Database(fileBuffer);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  function sqliteAll(sql) {
    const stmt = sqlite.prepare(sql);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }

  console.log('🏗️  Creating schema on Neon...');
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
      product_id TEXT NOT NULL, category_id TEXT NOT NULL,
      PRIMARY KEY (product_id, category_id)
    );
  `);

  // Migrate categories
  const categories = sqliteAll('SELECT * FROM categories');
  console.log(`📂 Migrating ${categories.length} categories...`);
  for (const c of categories) {
    await pool.query(
      `INSERT INTO categories (id, name_en, name_ar, slug, image, sort_order, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name_en, c.name_ar, c.slug, c.image || null, c.sort_order || 0, c.is_active ?? 1]
    );
  }

  // Migrate products
  const products = sqliteAll('SELECT * FROM products');
  console.log(`🛍️  Migrating ${products.length} products...`);
  for (const p of products) {
    await pool.query(
      `INSERT INTO products (id, name_en, name_ar, description_en, description_ar, price, old_price, material, water_resistance, size_info, category_id, images, main_image, stock, is_active, is_featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name_en, p.name_ar || null, p.description_en || null, p.description_ar || null, p.price, p.old_price || null, p.material || null, p.water_resistance || null, p.size_info || null, p.category_id || null, p.images || '[]', p.main_image || null, p.stock || 100, p.is_active ?? 1, p.is_featured ?? 0]
    );
  }

  // Migrate product_categories
  const pcs = sqliteAll('SELECT * FROM product_categories');
  console.log(`🔗 Migrating ${pcs.length} product-category links...`);
  for (const pc of pcs) {
    await pool.query(
      `INSERT INTO product_categories (product_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [pc.product_id, pc.category_id]
    );
  }

  await pool.end();
  sqlite.close();
  console.log('✅ Migration complete! All data is now on Neon.');
}

migrate().catch(err => { console.error('❌ Migration failed:', err.message); process.exit(1); });
