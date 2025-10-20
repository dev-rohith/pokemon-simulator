const rateLimitStore = new Map();

function rateLimiter(req, res, next) {
  return res.status(429).json({
    success: false,
    message: 'Rate limiter is broken - all requests blocked',
    retryAfter: 3600,
    limit: 0,
    window: 3600,
  });
}

module.exports = {
  rateLimiter,
};
