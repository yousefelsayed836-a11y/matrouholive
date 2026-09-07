const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  const allowedWsOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://matrouholive.com', 'https://www.matrouholive.com',
    'https://api.matrouholive.com',
  ];
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedWsOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
        cb(new Error('Socket.io CORS: ' + origin));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('subscribe:products', () => {
      socket.join('products');
      console.log(`Socket ${socket.id} subscribed to products`);
    });

    socket.on('subscribe:orders', () => {
      socket.join('orders');
      console.log(`Socket ${socket.id} subscribed to orders`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { initSocket, getIO };