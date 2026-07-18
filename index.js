require('dotenv').config();

const path = require('path');
const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Server: SocketIOServer } = require('socket.io');
const initDatabase = require('./db');

const app = express();
const server = http.createServer(app);

// ========== CONFIG ==========
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
const MAX_MESSAGE_LENGTH = parseInt(process.env.MAX_MESSAGE_LENGTH, 10) || 5000;
const MAX_USERNAME_LENGTH = parseInt(process.env.MAX_USERNAME_LENGTH, 10) || 30;
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.set('port', PORT);

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta más tarde.' },
});
app.use(limiter);

app.use(express.static(path.join(__dirname, 'Publico'), {
  maxAge: '1h',
  etag: true,
}));

// ========== INPUT SANITIZATION ==========
function sanitizeString(str, maxLength) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function isValidBase64Image(str) {
  if (typeof str !== 'string') return false;
  const maxLen = MAX_FILE_SIZE_MB * 1024 * 1024 * 1.4;
  if (str.length > maxLen) return false;
  return /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,/.test(str);
}

function isAllowedMimeType(mimeType) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return allowed.includes(mimeType);
}

// ========== DATABASE ==========
let db;
let dbReady = false;

initDatabase()
  .then((database) => {
    db = database;
    dbReady = true;
    console.log('Database initialized successfully');
  })
  .catch((err) => {
    console.error('Database initialization failed:', err.message);
    console.warn('Running without persistence');
  });

function saveMessage(username, message, image, time) {
  if (!dbReady || !db) return;
  try {
    db.run(
      'INSERT INTO messages (username, message, image, created_at) VALUES (?, ?, ?, ?)',
      [username, message || null, image || null, time || new Date().toISOString()]
    );
  } catch (err) {
    console.error('Error saving message:', err.message);
  }
}

function getRecentMessages(limit) {
  if (!dbReady || !db) return [];
  try {
    return db.exec(
      `SELECT username, message, image, created_at FROM messages ORDER BY id DESC LIMIT ${limit || 50}`
    );
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    return [];
  }
}

// ========== SOCKET.IO ==========
const io = new SocketIOServer(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  pingTimeout: 60000,
  pingInterval: 25000,
});

const connectedUsers = {};
const socketRateLimit = {};
const RATE_LIMIT_WINDOW_SOCKET = 1000;
const RATE_LIMIT_MAX_SOCKET = 10;

function checkSocketRateLimit(socketId) {
  const now = Date.now();
  if (!socketRateLimit[socketId]) {
    socketRateLimit[socketId] = { count: 1, windowStart: now };
    return true;
  }
  const rl = socketRateLimit[socketId];
  if (now - rl.windowStart > RATE_LIMIT_WINDOW_SOCKET) {
    rl.count = 1;
    rl.windowStart = now;
    return true;
  }
  rl.count++;
  return rl.count <= RATE_LIMIT_MAX_SOCKET;
}

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('chat:name', (data) => {
    if (!checkSocketRateLimit(socket.id)) {
      socket.emit('chat:error', 'Demasiadas peticiones, espera un momento.');
      return;
    }

    const name = sanitizeString(data, MAX_USERNAME_LENGTH);
    if (!name || name.length < 1 || name.length > MAX_USERNAME_LENGTH) return;

    connectedUsers[socket.id] = name;
    io.sockets.emit('chat:is_online', '\uD83D\uDD35 ' + name + ' se ha conectado');
    io.sockets.emit('chat:user_list', Object.values(connectedUsers));

    const messages = getRecentMessages(50);
    if (messages.length > 0 && messages[0] && messages[0].values) {
      socket.emit('chat:history', messages[0].values);
    }
  });

  socket.on('chat:message', (data) => {
    if (!checkSocketRateLimit(socket.id)) {
      socket.emit('chat:error', 'Demasiadas peticiones, espera un momento.');
      return;
    }

    if (!data || typeof data !== 'object') return;

    const username = sanitizeString(data.username, MAX_USERNAME_LENGTH);
    const message = sanitizeString(data.message, MAX_MESSAGE_LENGTH);
    const image = data.image;

    if (!username) return;
    if (!message && !image) return;
    if (image && !isValidBase64Image(image)) {
      socket.emit('chat:error', 'Tipo de imagen no permitido.');
      return;
    }

    const time = data.time || new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const msgData = { username, message, image: image || undefined, time };

    io.sockets.emit('chat:message', msgData);
    saveMessage(username, message, image, time);
  });

  socket.on('chat:typing', (data) => {
    if (!checkSocketRateLimit(socket.id)) return;
    const name = sanitizeString(data, MAX_USERNAME_LENGTH);
    if (name) {
      socket.broadcast.emit('chat:typing', name);
    }
  });

  socket.on('chat:request_users', () => {
    socket.emit('chat:user_list', Object.values(connectedUsers));
  });

  socket.on('disconnect', () => {
    const name = connectedUsers[socket.id];
    if (name) {
      delete connectedUsers[socket.id];
      delete socketRateLimit[socket.id];
      io.sockets.emit('chat:is_online', '\uD83D\uDD34 ' + name + ' se ha desconectado');
      io.sockets.emit('chat:user_list', Object.values(connectedUsers));
    }
    console.log('Socket disconnected:', socket.id);
  });
});

// ========== SERVER ==========
server.listen(app.get('port'), () => {
  console.log(`NodeChat running on port ${app.get('port')} [${process.env.NODE_ENV || 'development'}]`);
});

// ========== GRACEFUL SHUTDOWN ==========
function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);
  io.close();
  server.close(() => {
    if (db) {
      try { db.close(); } catch (e) {}
    }
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
