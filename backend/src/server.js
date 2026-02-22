require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const authRoutes    = require('./routes/auth');
const userRoutes    = require('./routes/user');
const paymentRoutes = require('./routes/payment');
const gameRoutes    = require('./routes/game');
const adminRoutes   = require('./routes/admin');
const { getPublicSettings } = require('./controllers/adminController');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter }             = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods:     ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
}));
app.set('trust proxy', 1);

// ─── Logging & parsing ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'ThinkTrophy API', ts: Date.now() }));

// ─── Public app settings (no auth required) ──────────────────────────────────
app.get('/api/app/settings', getPublicSettings);

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

app.listen(PORT, () => {
  console.log(`\n🏆 ThinkTrophy API running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
