import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { fileRoutes } from './routes/files.js';
import { authRoutes } from './routes/auth.js';
import { storageRoutes } from './routes/storage.js';
import { statsRoutes } from './routes/stats.js';
import { Database } from './database/index.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_PATH = process.env.STATIC_PATH || path.join(__dirname, '../../public');

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(logger.middleware);

app.use(express.static(STATIC_PATH));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(STATIC_PATH, 'index.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/files', authMiddleware, fileRoutes);
app.use('/api/storage', authMiddleware, storageRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

app.use(errorHandler);

Database.initialize();

app.listen(PORT, () => {
  console.log(`🚀 永远酱系统服务已启动: http://localhost:${PORT}`);
});

export default app;
