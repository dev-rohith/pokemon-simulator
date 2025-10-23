// In-memory cache use appropriate data structures
const cache = new Map();

// Check if key exists and not expired, return value or null
const get = (key) => {
  return null;
};

// Store value with expiry time (current time + ttl)
const set = (key, value, ttl = 300000) => {
};

// Delete key from cache
const deleteKey = (key) => {
};

// Clear all cache entries
const clear = () => {
};

module.exports = {
  get,
  set,
  delete: deleteKey,
  clear
};