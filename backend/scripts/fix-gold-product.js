// Run: node scripts/fix-gold-product.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  // Add columns if missing
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS matruh_only BOOLEAN DEFAULT FALSE').catch(() => {});
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE').catch(() => {});

  // Find the product
  const { rows } = await pool.query(`
    SELECT id, name_en, name_ar, stock, matruh_only, is_new, is_active
    FROM products
    WHERE LOWER(name_en) LIKE '%gold%' OR LOWER(name_en) LIKE '%virgin%'
       OR name_ar LIKE '%جولد%' OR name_ar LIKE '%اكسترا%' OR name_ar LIKE '%فيرجن%'
  `);

  if (rows.length === 0) {
    console.log('❌ لم يُعثر على المنتج. جرب:');
    const all = await pool.query('SELECT id, name_en, name_ar, stock FROM products WHERE is_active = true ORDER BY created_at DESC LIMIT 20');
    all.rows.forEach(p => console.log(`  ${p.id} | ${p.name_en} | ${p.name_ar} | stock: ${p.stock}`));
    await pool.end();
    return;
  }

  console.log('✅ وُجد المنتج:');
  rows.forEach(p => console.log(`  ${p.id} | ${p.name_en} | ${p.name_ar}`));

  // Fix all matching products
  for (const p of rows) {
    await pool.query(
      'UPDATE products SET matruh_only = TRUE, is_new = TRUE, stock = 0 WHERE id = $1',
      [p.id]
    );
    console.log(`✅ تم تحديث: ${p.name_ar || p.name_en}`);
    console.log('   - matruh_only = TRUE (مطروح فقط)');
    console.log('   - is_new = TRUE (أحدث المنتجات)');
    console.log('   - stock = 0 (نفذ المخزون)');
  }

  await pool.end();
  console.log('\n✅ تم! أعد تشغيل: pm2 restart matrouh-api');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
