require('dotenv').config();
const { initRedis, pingRedis } = require('./utils/redis');
initRedis();

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/user');
const paymentRoutes = require('./routes/payment');
const gameRoutes    = require('./routes/game');
const adminRoutes   = require('./routes/admin');
const { getPublicSettings, getPublicTestimonials } = require('./controllers/adminController');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter }             = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet());

function corsOrigin() {
  const raw = (process.env.CORS_ORIGIN || '').trim();
  if (!raw || raw === '*') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGIN must be an explicit allowlist in production');
    }
    return true;
  }
  const allowlist = raw.split(',').map(s => s.trim()).filter(Boolean);
  return (origin, callback) => {
    if (!origin || allowlist.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  };
}

app.use(cors({
  origin:      corsOrigin(),
  credentials: true,
  methods:     ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
}));
app.set('trust proxy', 1);

// ─── Logging & parsing ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const redis = await pingRedis();
  res.json({
    status: 'ok',
    service: 'ThinkTrophy API',
    redis,
    ts: Date.now(),
  });
});

// ─── Public app / landing (no auth required) ────────────────────────────────
app.get('/api/app/settings', getPublicSettings);
app.get('/api/app/testimonials', getPublicTestimonials);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api',          apiLimiter);
app.use('/api/auth',     authRoutes);
app.use('/api/user',     userRoutes);
app.use('/api/payment',  paymentRoutes);
app.use('/api/game',     gameRoutes);
app.use('/api/admin',    adminRoutes);

// ─── Error handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`\n🏆 ThinkTrophy API running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 30000;
server.timeout = 30000;

module.exports = app;
