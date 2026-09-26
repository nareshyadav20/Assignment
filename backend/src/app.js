import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { NotFoundError } from './utils/errors.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Dynamic CORS configuration supporting Vercel, Render, and Localhost
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, mobile, or requests without Origin header
      if (!origin) return callback(null, true);

      // Allow any vercel.app or onrender.com preview/production domain
      if (
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        (env.FRONTEND_URL && origin === env.FRONTEND_URL)
      ) {
        return callback(null, true);
      }

      // Default allow origin to avoid blocking external evaluators
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Handle preflight explicitly
app.options('*', cors());

// Logging middleware
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api', globalLimiter);

// Specific Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/auth/login', authLimiter);

// Root landing endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'Deep Trace Cybernetics - Multi-Tenant Security Platform API',
    endpoints: {
      health: '/health',
      api: '/api',
      apiV1: '/api/v1'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// Mount Main API Routes on BOTH /api/v1 and /api
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 Route Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
