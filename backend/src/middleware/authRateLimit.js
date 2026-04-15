const loginAttemptsByIp = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 25;

const getClientKey = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
};

const authRateLimit = (req, res, next) => {
  const now = Date.now();
  const key = getClientKey(req);
  const current = loginAttemptsByIp.get(key);

  if (!current || current.resetAt <= now) {
    loginAttemptsByIp.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      message: 'Too many authentication attempts from this IP. Please try again later.',
    });
  }

  current.count += 1;
  loginAttemptsByIp.set(key, current);
  return next();
};

module.exports = { authRateLimit };
