const express = require('express');
const router = express.Router();
const { allQuery, getQuery, runQuery } = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const { sendOrderEmail } = require('../services/email');

router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_phone, phone2, shipping_address, address, customer_city, city, governorate, items, notes, shipping_cost: reqShipping, total_amount } = req.body;
    const finalName = customer_name || req.body.fullName || '';
    const finalPhone = customer_phone || req.body.phone || '';
    const finalAddress = shipping_address || address || '';
    const finalCity = customer_city || city || '';
    if (!finalName) return res.status(400).json({ error: 'customer_name is required' });
    if (!finalPhone) return res.status(400).json({ error: 'customer_phone is required' });
    let itemsTotal = 0;
    if (items && Array.isArray(items)) { for (const item of items) itemsTotal += item.price * item.quantity; }
    const shipping_cost = reqShipping !== undefined ? reqShipping : (itemsTotal >= 900 ? 0 : 100);
    const total = total_amount || (itemsTotal + shipping_cost);
    const id = uuidv4();
    await runQuery(`INSERT INTO orders (id, customer_name, customer_phone, phone2, shipping_address, city, governorate, total_amount, shipping_cost, notes, status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'cash_on_delivery')`,
      [id, finalName, finalPhone, phone2 || null, finalAddress, finalCity, governorate || null, total, shipping_cost, notes || null]);
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await runQuery(`INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, size, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), id, item.product_id, item.product_name || null, item.quantity, item.price, item.size || null, item.price * item.quantity]);
        try { await runQuery('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]); } catch(e) {}
        if (item.size) {
          try { await runQuery('UPDATE product_variants SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ? AND option_value = ?', [item.quantity, item.product_id, item.size]); } catch(e) {}
        }
      }
    }
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
    // fire-and-forget email notification
    const emailItems = items || [];
    sendOrderEmail({ id, customer_name: finalName, customer_phone: finalPhone, phone2: phone2 || null, shipping_address: finalAddress, city: finalCity, governorate: governorate || null, total_amount: total, shipping_cost, notes: notes || null, status: 'pending' }, emailItems).catch(e => console.error('Email error:', e));
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) { console.error('Order creation error:', error); res.status(500).json({ error: error.message }); }
});

router.get('/customers', async (req, res) => {
  try {
    const customers = await allQuery(`
      SELECT
        customer_phone,
        MAX(customer_name) as customer_name,
        MAX(shipping_address) as shipping_address,
        MAX(city) as city,
        MAX(governorate) as governorate,
        COUNT(*) as order_count,
        SUM(total_amount) as total_spent,
        MAX(created_at) as last_order_date,
        MIN(created_at) as first_order_date
      FROM orders
      GROUP BY customer_phone
      ORDER BY last_order_date DESC
    `);
    res.json(customers);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/customer/:phone', async (req, res) => {
  try {
    const orders = await allQuery(
      'SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC',
      [req.params.phone]
    );
    const result = await Promise.all(orders.map(async o => ({
      ...o, items: await allQuery('SELECT * FROM order_items WHERE order_id = ?', [o.id])
    })));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/', async (req, res) => {
  try {
    const orders = await allQuery('SELECT * FROM orders ORDER BY created_at DESC');
    const result = await Promise.all(orders.map(async o => ({ ...o, items: await allQuery('SELECT * FROM order_items WHERE order_id = ?', [o.id]) })));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ ...order, items });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    const oldOrder = await getQuery('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (!oldOrder) return res.status(404).json({ error: 'Order not found' });
    if (status === 'cancelled' && oldOrder.status !== 'cancelled') {
      const orderItems = await allQuery('SELECT product_id, quantity, size FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of orderItems) {
        try { await runQuery('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]); } catch(e) {}
        if (item.size) {
          try { await runQuery('UPDATE product_variants SET quantity = quantity + ? WHERE product_id = ? AND option_value = ?', [item.quantity, item.product_id, item.size]); } catch(e) {}
        }
      }
    }
    if (oldOrder.status === 'cancelled' && status !== 'cancelled') {
      const orderItems = await allQuery('SELECT product_id, quantity, size FROM order_items WHERE order_id = ?', [orderId]);
      for (const item of orderItems) {
        try { await runQuery('UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?', [item.quantity, item.product_id]); } catch(e) {}
        if (item.size) {
          try { await runQuery('UPDATE product_variants SET quantity = GREATEST(0, quantity - ?) WHERE product_id = ? AND option_value = ?', [item.quantity, item.product_id, item.size]); } catch(e) {}
        }
      }
    }
    await runQuery('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    res.json(await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const orderItems = await allQuery('SELECT product_id, quantity, size FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of orderItems) {
      try { await runQuery('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]); } catch(e) {}
      if (item.size) {
        try { await runQuery('UPDATE product_variants SET quantity = quantity + ? WHERE product_id = ? AND option_value = ?', [item.quantity, item.product_id, item.size]); } catch(e) {}
      }
    }
    await runQuery('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    await runQuery('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Order deleted and stock restored' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
