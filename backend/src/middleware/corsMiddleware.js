
const cors = require('cors');

const LOCALHOST_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const parseOrigins = (raw) => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const corsMiddleware = cors({
  origin: (origin, cb) => {
    const allowed = parseOrigins(process.env.CLIENT_ORIGINS || '');
    if (!origin) return cb(null, true); // e.g., curl, Postman
    // In local development, Vite may move between ports (5173, 5174, 5175, ...).
    if (LOCALHOST_PATTERN.test(origin)) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
});

module.exports = corsMiddleware;
