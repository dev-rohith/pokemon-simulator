const rateLimitStore = new Map();

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
    'unknown'
  );
}

function rateLimiter(req, res, next) {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

  const now = Date.now();
  const ip = getClientIp(req);

  let entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(ip, entry);
  }

  entry.count += 1;

  const remaining = Math.max(0, maxRequests - entry.count);
  const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.floor(entry.resetTime / 1000)));

  if (entry.count > maxRequests) {
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
      retryAfter: retryAfterSec,
      limit: maxRequests,
      window: windowMs / 1000,
    });
  }

  next();
}

module.exports = {
  rateLimiter,
};
