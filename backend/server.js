const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const { initSocket } = require('./config/socket');
const { initDb } = require('./database/db');

dotenv.config();

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001']
  : ['*'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Bypass auth for development
app.use((req, res, next) => { req.user = { id: 'admin', role: 'admin' }; next(); });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const bulkUploadRoutes = require('./routes/admin/bulkUpload');
app.use('/api/admin/products/bulk-upload', upload.single('csv'), bulkUploadRoutes);

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '-');
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    res.json({ success: true, url: `${BASE_URL}/uploads/${filename}` });
  } catch (error) { console.error('Upload error:', error); res.status(500).json({ error: 'Upload failed' }); }
});

app.post('/api/upload/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded' });
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    const urls = req.files.map(file => {
      const filename = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
      fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);
      return `${BASE_URL}/uploads/${filename}`;
    });
    res.json({ success: true, urls });
  } catch (error) { res.status(500).json({ error: 'Upload failed' }); }
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

const PORT = process.env.PORT || 5000;

// Initialize DB then start server
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} - Matrouh Olive Store`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
