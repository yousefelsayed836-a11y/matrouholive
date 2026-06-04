const express = require('express');
const compression = require('compression');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const { initSocket } = require('./config/socket');
const { initDb } = require('./database/db');

dotenv.config();

// Keep the process alive — log errors but don't crash on unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const app = express();
app.use(compression());

const allowedOrigins = (() => {
  const base = [
    'http://localhost:3000', 'http://localhost:3001',
    'https://matrouholive.com', 'https://www.matrouholive.com',
    'https://api.matrouholive.com',
  ];
  if (process.env.FRONTEND_URL) {
    const clean = process.env.FRONTEND_URL.replace(/\/$/, '');
    if (!base.includes(clean)) base.push(clean);
  }
  return base;
})();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Bypass auth for development
app.use((req, res, next) => { req.user = { id: 'admin', role: 'admin' }; next(); });

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({ storage: multer.memoryStorage() });

const server = http.createServer(app);
const io = initSocket(server);
app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/reviews', require('./routes/reviews'));

const bulkUploadRoutes = require('./routes/admin/bulkUpload');
app.use('/api/admin/products/bulk-upload', upload.single('csv'), bulkUploadRoutes);

app.get('/api/upload', (req, res) => {
  res.json({ connected: !!process.env.GITHUB_TOKEN, repo: process.env.GITHUB_REPO || 'yousefelsayed836-a11y/matrouholive' });
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const token = process.env.GITHUB_TOKEN;
    const repo  = process.env.GITHUB_REPO || 'yousefelsayed836-a11y/matrouholive';
    if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const filename = `uploads/${Date.now()}.${ext}`;
    const content  = req.file.buffer.toString('base64');
    const ghRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filename}`, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `upload ${filename}`, content }),
    });
    if (!ghRes.ok) { const e = await ghRes.json(); throw new Error(e.message || 'GitHub error'); }
    const url = `https://raw.githubusercontent.com/${repo}/main/${filename}`;
    res.json({ success: true, url });
  } catch (error) { console.error('Upload error:', error); res.status(500).json({ error: String(error.message) }); }
});

app.post('/api/upload/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded' });
    const token = process.env.GITHUB_TOKEN;
    const repo  = process.env.GITHUB_REPO || 'yousefelsayed836-a11y/matrouholive';
    if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
    const urls = await Promise.all(req.files.map(async (file) => {
      const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
      const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const content  = file.buffer.toString('base64');
      const ghRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filename}`, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `upload ${filename}`, content }),
      });
      if (!ghRes.ok) { const e = await ghRes.json(); throw new Error(e.message); }
      return `https://raw.githubusercontent.com/${repo}/main/${filename}`;
    }));
    res.json({ success: true, urls });
  } catch (error) { res.status(500).json({ error: String(error.message) }); }
});

const clients = new Set();
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  clients.add(res);
  res.write('data: ' + JSON.stringify({ type: 'connected' }) + '\n\n');
  const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000);
  req.on('close', () => { clearInterval(heartbeat); clients.delete(res); });
});

app.set('broadcast', (data) => {
  const message = 'data: ' + JSON.stringify(data) + '\n\n';
  clients.forEach(client => { try { client.write(message); } catch (e) {} });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', store: 'Matrouh Olive', timestamp: new Date().toISOString() });
});

app.post('/api/test-email', async (req, res) => {
  try {
    const { sendOrderEmail } = require('./services/email');
    await sendOrderEmail({
      id: 'test-000000000000',
      customer_name: 'اختبار إيميل',
      customer_phone: '01000000000',
      phone2: null,
      shipping_address: 'شارع الاختبار، مدينة نصر',
      city: 'القاهرة',
      governorate: 'القاهرة',
      total_amount: 1250,
      shipping_cost: 0,
      notes: 'هذا إيميل اختبار من لوحة التحكم',
      status: 'pending',
    }, [
      { product_name: 'زيت زيتون بكر 500 مل', quantity: 2, price: 450, total: 900 },
      { product_name: 'زيت زيتون 250 مل', quantity: 1, price: 350, total: 350 },
    ]);
    res.json({ success: true, message: 'تم إرسال الإيميل بنجاح!' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// One-time migration: upload base64 images from DB to GitHub and replace with URLs
app.post('/api/admin/migrate-images', async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'yousefelsayed836-a11y/matrouholive';
  if (!token) return res.status(400).json({ error: 'GITHUB_TOKEN not set — add it to Render env vars first' });
  const { allQuery, runQuery } = require('./database/db');
  const products = await allQuery('SELECT id, main_image, images FROM products');
  let migrated = 0, skipped = 0, errors = [];
  for (const p of products) {
    let images = [];
    try { images = JSON.parse(p.images || '[]'); } catch { images = []; }
    const allImgs = [...new Set([p.main_image, ...images].filter(Boolean))];
    const hasBase64 = allImgs.some(i => i.startsWith('data:'));
    if (!hasBase64) { skipped++; continue; }
    const newUrls = [];
    for (const img of images) {
      if (!img.startsWith('data:')) { newUrls.push(img); continue; }
      try {
        const matches = img.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) { newUrls.push(img); continue; }
        const ext = matches[1].split('/')[1] || 'jpg';
        const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const ghRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filename}`, {
          method: 'PUT',
          headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `migrate ${filename}`, content: matches[2] }),
        });
        if (!ghRes.ok) throw new Error((await ghRes.json()).message);
        newUrls.push(`https://raw.githubusercontent.com/${repo}/main/${filename}`);
      } catch (e) { newUrls.push(img); errors.push(`${p.id}: ${e.message}`); }
    }
    const newMain = p.main_image && p.main_image.startsWith('data:')
      ? newUrls[0] || p.main_image
      : p.main_image;
    await runQuery('UPDATE products SET images = ?, main_image = ? WHERE id = ?', [JSON.stringify(newUrls), newMain, p.id]);
    migrated++;
  }
  res.json({ success: true, migrated, skipped, errors });
});

const PORT = process.env.PORT || 5000;

// Retry DB init with exponential backoff before giving up
async function startWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await initDb();
      server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT} - Matrouh Olive Store`);
      });
      return;
    } catch (err) {
      console.error(`DB init attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      } else {
        console.error('All DB init attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
}

startWithRetry();
