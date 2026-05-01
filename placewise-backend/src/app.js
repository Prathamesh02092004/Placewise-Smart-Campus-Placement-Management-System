require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { publicLimiter, authLimiter } = require('./middleware/rateLimit.middleware');



const app = express();

// ── Security Headers ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads to be served
}));

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,           // allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));         // reject huge JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(compression());

// ── HTTP Request Logging ──────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));
}

// ── Static File Serving (local resume/offer letter storage) ───────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check (no auth, no rate limit) ─────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'placewise-backend',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// ── Public Rate Limiter on auth routes ───────────────────────────
app.use('/api/auth', publicLimiter);

const authRoutes        = require('./routes/auth.routes');
const studentRoutes     = require('./routes/student.routes');
const jobRoutes         = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const interviewRoutes   = require('./routes/interview.routes');
const placementRoutes   = require('./routes/placement.routes');
const adminRoutes       = require('./routes/admin.routes');
const skillGapRoutes    = require('./routes/skillGap.routes');
const notificationRoutes = require('./routes/notification.routes');

app.use('/api/notifications', notificationRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/jobs',         jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews',   interviewRoutes);
app.use('/api/placement',    placementRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/skill-gap',    skillGapRoutes);


// ── 404 Handler ───────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;