const path = require('path');
const { initDb, runQuery, allQuery, saveDb } = require('../database/db');

async function updateStock() {
  await initDb();

  const products = allQuery('SELECT id, name_ar, name_en, stock FROM products');
  console.log(`Found ${products.length} products`);

  runQuery('UPDATE products SET stock = 100 WHERE 1=1');
  saveDb();

  const updated = allQuery('SELECT id, name_ar, stock FROM products');
  console.log('\nAll products stock updated:');
  updated.forEach(p => console.log(`  ✓ ${p.name_ar || p.name_en} → stock: ${p.stock}`));
  console.log(`\nTotal: ${updated.length} products updated to stock = 100`);
}

updateStock().catch(console.error);
