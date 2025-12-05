import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// route + config imports
import { validateConfig } from './lib/config';
import contractRoutes from './routes/contract';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profiles';
import membershipRoutes from './routes/membership';
import creatorRoutes from './routes/creator';
import resourceRoutes from './routes/resources';
import purchaseRoutes from './routes/purchase';
import downloadRoutes from './routes/download';
import checkoutRoutes from './routes/checkout';
import webhookRoutes from './routes/webhooks';
import searchRoutes from './routes/search';
import adminRoutes from './routes/admin';
import reportsRoutes from './routes/reports';
import messagingRoutes from './routes/messaging';
import notificationsRoutes from './routes/notifications';
import reviewRoutes from './routes/reviews';
import followRoutes from './routes/follows';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

const allowedOrigins = [
  'https://c2c-site.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:4173',
  process.env.SITE_URL,
].filter(Boolean);

// Wildcard pattern matching for Vercel preview deployments
function matchWildcard(pattern: string, s: string): boolean {
  const re = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return re.test(s);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no origin (server-to-server)
      if (!origin) return callback(null, true);

      // Allow explicit origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow all Vercel preview deployments
      if (matchWildcard('https://*.vercel.app', origin)) return callback(null, true);

      // Block everything else
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Client-Info',
      'apikey',
      'X-CSRF-Token'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count', 'Content-Type'],
    credentials: true,
    maxAge: 86400,
  })
);

// Explicit OPTIONS handler for preflight requests (handled by CORS middleware above)

app.use(express.json());

// ---------- CRITICAL: HEALTHZ MUST BE FIRST ----------
// Register healthz BEFORE any other middleware or routes to guarantee availability
app.get('/api/healthz', (_req, res) => {
  res.send('ok');
});

// ---------- STABLE API CONTRACT ----------
// Mount contract routes FIRST to guarantee endpoint availability
// This prevents 404 errors by ensuring critical paths always exist
app.use('/api', contractRoutes);

// ---- config logging ----
try {
  validateConfig();
  console.log('✅ Configuration validated');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Site URL: ${process.env.SITE_URL || 'http://localhost:5175'}`);
  console.log(
    `   Paid features: ${
      process.env.ENABLE_PAYMENTS === 'true' ? 'enabled' : 'disabled'
    }`
  );
  console.log(
    `   Platform fee: ${process.env.PLATFORM_FEE_PERCENT || '1.5%'}%`
  );
  console.log('✅ All required environment variables are set');
} catch (err: any) {
  console.error('❌ Config validation failed:', err.message || err);
}

// ---------- API ROUTES ----------
// Note: Contract routes are mounted above and handle:
//   - /api/healthz
//   - /api/auth/login, /api/auth/signup, /api/auth/logout
//   - /api/resources (stub will be overridden by resourceRoutes below)
// The routes below provide additional functionality not in the contract
app.use('/api/profiles', profileRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/follows', followRoutes);

// health checks
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'v1', time: new Date().toISOString() });
});
app.get('/api/v2/health', (_req, res) => {
  res.json({ ok: true, service: 'v2', time: new Date().toISOString() });
});

// ---------- STATIC FRONTEND (dist) ----------

// emulate __dirname (because we're in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// this assumes:
//   project root/
//     dist/            <-- built frontend
//     server/index.ts
const frontendDistPath = path.join(__dirname, '../dist');

// serve static files (react build output)
app.use(express.static(frontendDistPath));

// fallback for ALL non-API routes
// instead of app.get('*', ...) we use a regex that excludes /api
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ---------- CATCH-ALL 404 HANDLER ----------
// This should catch any unhandled routes for debugging
app.use((req, res) => {
  console.log('❌ 404 MISS:', req.method, req.path);
  res.status(404).json({
    error: 'not found',
    path: req.path,
    method: req.method
  });
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Coach2Coach API Server running on port ${PORT}`);
  console.log(
    `📡 Webhook endpoint: http://localhost:${PORT}/api/webhooks/stripe`
  );
  console.log(
    `📡 V2 Webhook endpoint: http://localhost:${PORT}/api/v2/stripe/webhook`
  );
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 V2 Health check: http://localhost:${PORT}/api/v2/health`);
});
