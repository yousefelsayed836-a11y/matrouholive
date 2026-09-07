const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// Settings
router.get('/settings', async (req, res) => {
  try {
    const rows = await allQuery('SELECT key, value FROM olive_settings');
    const s = { price_per_ton: '500', has_price_password: false };
    rows.forEach(r => {
      if (r.key === 'price_edit_password') s.has_price_password = !!r.value;
      else s[r.key] = r.value; // never expose the password itself
    });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Verify price-edit password (password never leaves the server)
router.post('/verify-price-password', async (req, res) => {
  try {
    const { password } = req.body;
    const setting = await getQuery("SELECT value FROM olive_settings WHERE key='price_edit_password'");
    if (!setting || !setting.value) return res.json({ valid: true }); // no password set
    res.json({ valid: setting.value === password });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/settings', async (req, res) => {
  try {
    for (const [k, v] of Object.entries(req.body)) {
      await runQuery(
        'INSERT INTO olive_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [k, String(v)]
      );
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await allQuery(`
      SELECT c.*,
        COALESCE(SUM(o.tons), 0) AS total_tons,
        COALESCE(SUM(o.total_cost), 0) AS total_cost,
        COALESCE(SUM(o.paid_amount), 0) AS total_paid,
        COALESCE(SUM(o.remaining_amount), 0) AS total_remaining,
        COUNT(o.id) AS order_count
      FROM olive_customers c
      LEFT JOIN olive_orders o ON LOWER(TRIM(o.customer_name)) = LOWER(TRIM(c.name))
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(customers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/customers', async (req, res) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم العميل مطلوب' });
    const id = uuidv4();
    await runQuery(
      'INSERT INTO olive_customers (id, name, phone, notes) VALUES (?, ?, ?, ?)',
      [id, name.trim(), phone || null, notes || null]
    );
    res.json(await getQuery('SELECT * FROM olive_customers WHERE id = ?', [id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM olive_customers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Workers
router.get('/workers', async (req, res) => {
  try {
    res.json(await allQuery('SELECT * FROM olive_workers ORDER BY created_at DESC'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/workers', async (req, res) => {
  try {
    const { name, phone, role, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'اسم العامل مطلوب' });
    const id = uuidv4();
    await runQuery(
      'INSERT INTO olive_workers (id, name, phone, role, notes) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), phone || null, role || null, notes || null]
    );
    res.json(await getQuery('SELECT * FROM olive_workers WHERE id = ?', [id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/workers/:id', async (req, res) => {
  try {
    const { name, phone, role, notes } = req.body;
    await runQuery(
      'UPDATE olive_workers SET name=?, phone=?, role=?, notes=? WHERE id=?',
      [name, phone || null, role || null, notes || null, req.params.id]
    );
    res.json(await getQuery('SELECT * FROM olive_workers WHERE id=?', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/workers/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM olive_workers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Orders
router.get('/orders', async (req, res) => {
  try {
    res.json(await allQuery('SELECT * FROM olive_orders ORDER BY created_at DESC'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders', async (req, res) => {
  try {
    const { customer_name, customer_phone, car_number, car_weight, olive_weight, tons, notes, order_sequence, payment_method, paid_amount } = req.body;
    if (!customer_name) return res.status(400).json({ error: 'اسم العميل مطلوب' });
    if (!tons || isNaN(tons) || parseFloat(tons) <= 0) return res.status(400).json({ error: 'عدد الأطنان مطلوب' });

    // Allow a per-order custom price (requires password verification on the client)
    let price;
    const customPrice = parseFloat(req.body.custom_price);
    if (customPrice > 0 && !isNaN(customPrice)) {
      price = customPrice;
    } else {
      const setting = await getQuery("SELECT value FROM olive_settings WHERE key='price_per_ton'");
      price = parseFloat(setting?.value || 500);
    }
    const total = Math.round(parseFloat(tons) * price * 100) / 100;

    let paid = 0, remaining = total;
    if (payment_method === 'vodafone_cash' || payment_method === 'instapay') {
      paid = total; remaining = 0;
    } else if (payment_method === 'partial') {
      paid = Math.round(parseFloat(paid_amount || 0) * 100) / 100;
      remaining = Math.round((total - paid) * 100) / 100;
    }

    const id = uuidv4();
    await runQuery(`
      INSERT INTO olive_orders
        (id, customer_name, customer_phone, car_number, car_weight, olive_weight, tons, notes, order_sequence, pressing_cost_per_ton, total_cost, payment_method, paid_amount, remaining_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, customer_name.trim(), customer_phone || null, car_number || null,
      car_weight ? parseFloat(car_weight) : null,
      olive_weight ? parseFloat(olive_weight) : null,
      parseFloat(tons), notes || null,
      order_sequence ? parseInt(order_sequence) : null,
      price, total, payment_method || 'vodafone_cash', paid, remaining]);

    const order = await getQuery('SELECT * FROM olive_orders WHERE id=?', [id]);
    const io = req.app.get('io');
    if (io) io.emit('olive_new_order', { order });
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM olive_orders WHERE id=?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'الأوردر غير موجود' });
    const paid = parseFloat(req.body.paid_amount ?? order.paid_amount);
    const remaining = Math.round((parseFloat(order.total_cost) - paid) * 100) / 100;
    const status = req.body.status || order.status;
    await runQuery(
      'UPDATE olive_orders SET paid_amount=?, remaining_amount=?, status=? WHERE id=?',
      [paid, remaining, status, req.params.id]
    );
    res.json(await getQuery('SELECT * FROM olive_orders WHERE id=?', [req.params.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM olive_orders WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Accounts summary
router.get('/accounts', async (req, res) => {
  try {
    const orders = await allQuery('SELECT * FROM olive_orders ORDER BY created_at DESC');
    const totalTons = orders.reduce((s, o) => s + parseFloat(o.tons || 0), 0);
    const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_cost || 0), 0);
    const totalCollected = orders.reduce((s, o) => s + parseFloat(o.paid_amount || 0), 0);
    const totalRemaining = orders.reduce((s, o) => s + parseFloat(o.remaining_amount || 0), 0);

    const byCustomer = {};
    for (const o of orders) {
      const k = o.customer_name.trim().toLowerCase();
      if (!byCustomer[k]) byCustomer[k] = { name: o.customer_name, tons: 0, total_cost: 0, paid: 0, remaining: 0, count: 0 };
      byCustomer[k].tons += parseFloat(o.tons || 0);
      byCustomer[k].total_cost += parseFloat(o.total_cost || 0);
      byCustomer[k].paid += parseFloat(o.paid_amount || 0);
      byCustomer[k].remaining += parseFloat(o.remaining_amount || 0);
      byCustomer[k].count++;
    }

    res.json({
      summary: { totalOrders: orders.length, totalTons, totalRevenue, totalCollected, totalRemaining },
      customers: Object.values(byCustomer).sort((a, b) => b.remaining - a.remaining),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Customer orders
router.get('/customers/:name/orders', async (req, res) => {
  try {
    const orders = await allQuery(
      "SELECT * FROM olive_orders WHERE LOWER(TRIM(customer_name)) = LOWER(TRIM(?)) ORDER BY created_at DESC",
      [req.params.name]
    );
    res.json(orders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
