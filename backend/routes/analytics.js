const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database/db');

async function ensureEventsTable() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      product_id VARCHAR(200),
      product_name VARCHAR(500),
      session_id VARCHAR(100),
      metadata TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}

// Record event (view, cart_add, checkout_start, order_complete)
router.post('/event', async (req, res) => {
  try {
    await ensureEventsTable();
    const { event_type, product_id, product_name, session_id, metadata } = req.body;
    if (!event_type) return res.status(400).json({ error: 'event_type required' });
    await runQuery(
      'INSERT INTO analytics_events (event_type, product_id, product_name, session_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [event_type, product_id || null, product_name || null, session_id || null, metadata ? JSON.stringify(metadata) : null]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Overview stats
router.get('/overview', async (req, res) => {
  try {
    const [all, monthly, weekly, today, statusDist] = await Promise.all([
      getQuery(`SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount),0) as total_revenue, COALESCE(ROUND(AVG(total_amount)::numeric,2),0) as avg_order_value, COUNT(DISTINCT customer_phone) as unique_customers FROM orders`),
      getQuery(`SELECT COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '30 days'`),
      getQuery(`SELECT COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '7 days'`),
      getQuery(`SELECT COUNT(*) as orders, COALESCE(SUM(total_amount),0) as revenue FROM orders WHERE status != 'cancelled' AND created_at >= date_trunc('day', NOW())`),
      allQuery(`SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount),0) as revenue FROM orders GROUP BY status ORDER BY count DESC`),
    ]);
    res.json({ all, monthly, weekly, today, statusDist });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Product performance
router.get('/products', async (req, res) => {
  try {
    const products = await allQuery(`
      SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as total_sold,
        COALESCE(SUM(oi.total),0) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count,
        ROUND(AVG(oi.price)::numeric,2) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sold DESC
      LIMIT 50
    `);
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Bought together
router.get('/bought-together', async (req, res) => {
  try {
    const pairs = await allQuery(`
      SELECT
        a.product_name as product1,
        b.product_name as product2,
        COUNT(*) as times_together
      FROM order_items a
      JOIN order_items b ON a.order_id = b.order_id AND a.product_id < b.product_id
      JOIN orders o ON a.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY a.product_name, b.product_name
      ORDER BY times_together DESC
      LIMIT 20
    `);
    res.json(pairs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Revenue timeline
router.get('/timeline', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);
    const timeline = await allQuery(`
      SELECT
        TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    res.json(timeline);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Funnel from events
router.get('/funnel', async (req, res) => {
  try {
    await ensureEventsTable();
    const [views, cartAdds, checkouts, orders] = await Promise.all([
      getQuery(`SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'product_view' AND created_at >= NOW() - INTERVAL '30 days'`),
      getQuery(`SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'cart_add' AND created_at >= NOW() - INTERVAL '30 days'`),
      getQuery(`SELECT COUNT(*) as count FROM analytics_events WHERE event_type = 'checkout_start' AND created_at >= NOW() - INTERVAL '30 days'`),
      getQuery(`SELECT COUNT(*) as count FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'`),
    ]);

    // Top viewed products
    const topViewed = await allQuery(`
      SELECT product_name, COUNT(*) as views
      FROM analytics_events
      WHERE event_type = 'product_view' AND product_name IS NOT NULL
      GROUP BY product_name ORDER BY views DESC LIMIT 10
    `).catch(() => []);

    res.json({
      funnel: [
        { step: 'مشاهدة منتج', count: parseInt(views?.count) || 0 },
        { step: 'إضافة للسلة', count: parseInt(cartAdds?.count) || 0 },
        { step: 'بدء الشراء', count: parseInt(checkouts?.count) || 0 },
        { step: 'إتمام الطلب', count: parseInt(orders?.count) || 0 },
      ],
      topViewed,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Gov distribution
router.get('/geography', async (req, res) => {
  try {
    const geo = await allQuery(`
      SELECT
        COALESCE(governorate, city, 'غير محدد') as region,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount),0) as revenue
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY COALESCE(governorate, city, 'غير محدد')
      ORDER BY orders DESC
      LIMIT 20
    `);
    res.json(geo);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
