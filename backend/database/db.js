const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Resolve DB path: env var → local data dir (works on free hosting too)
const dbPath = process.env.DB_PATH || path.join(dbDir, 'matrouholive.db');

let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      full_name TEXT NOT NULL, phone TEXT, address TEXT, role TEXT DEFAULT 'customer',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL, image TEXT, sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_ar TEXT,
      description_en TEXT, description_ar TEXT, price REAL NOT NULL, old_price REAL,
      material TEXT, water_resistance TEXT, size_info TEXT, category_id TEXT,
      images TEXT DEFAULT '[]', main_image TEXT, stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1, is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
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
      notes TEXT, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT,
      product_id TEXT, product_name TEXT,
      quantity INTEGER NOT NULL, price REAL NOT NULL, size TEXT, total REAL
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY, user_id TEXT, product_id TEXT,
      quantity INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS product_categories (
      product_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      PRIMARY KEY (product_id, category_id)
    );
  `);
  saveDb();
  return db;
}

// Synchronous query interface (sql.js is synchronous)
function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

function runQuery(sql, params = []) {
  const d = getDb();
  const result = d.run(sql, params);
  saveDb();
  return result;
}

function allQuery(sql, params = []) {
  const d = getDb();
  const stmt = d.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function getQuery(sql, params = []) {
  const rows = allQuery(sql, params);
  return rows[0] || null;
}

function parseRow(row) {
  if (!row) return row;
  const result = { ...row };
  for (const key of ['images', 'variants']) {
    if (result[key] && typeof result[key] === 'string') {
      try { result[key] = JSON.parse(result[key]); } catch {}
    }
  }
  if ('is_active' in result) result.is_active = result.is_active === 1 || result.is_active === true;
  if ('is_featured' in result) result.is_featured = result.is_featured === 1 || result.is_featured === true;
  return result;
}

// pg-compatible async query wrapper
function query(text, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const trimmed = text.trim().toUpperCase();
      let sqliteText = text.replace(/\$(\d+)/g, (_, n) => '?');
      const returningMatch = sqliteText.match(/RETURNING\s+[\s\S]*/i);
      let hasReturning = false;
      let tableName = null;
      if (returningMatch) {
        sqliteText = sqliteText.replace(/\s*RETURNING\s+[\s\S]*/i, '');
        hasReturning = true;
        tableName = text.match(/(?:INSERT\s+INTO|UPDATE)\s+(\w+)/i)?.[1];
      }

      if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
        const rows = allQuery(sqliteText, params).map(parseRow);
        resolve({ rows, rowCount: rows.length });
      } else {
        runQuery(sqliteText, params);
        if (hasReturning && tableName) {
          let row = null;
          if (trimmed.startsWith('INSERT')) {
            const lastId = allQuery('SELECT last_insert_rowid() as lid')[0]?.lid;
            if (lastId !== undefined) row = getQuery(`SELECT * FROM ${tableName} WHERE rowid = ?`, [lastId]);
          } else if (trimmed.startsWith('UPDATE') && params.length > 0) {
            const id = params[params.length - 1];
            row = getQuery(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
          }
          resolve({ rows: row ? [parseRow(row)] : [], rowCount: 1 });
        } else {
          resolve({ rows: [], rowCount: 0 });
        }
      }
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  initDb,
  getDb,
  runQuery,
  allQuery,
  getQuery,
  parseRow,
  query,
  saveDb,
  connect: () => Promise.resolve({ query: (text, params) => query(text, params), release: () => {} })
};
