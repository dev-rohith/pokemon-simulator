// In-memory cache use appropriate data structures
const cache = new Map();

// Check if key exists and not expired, return value or null
const get = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  const now = Date.now();
  if (now > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};

// Store value with expiry time (current time + ttl)
const set = (key, value, ttl = 300000) => {
  const expiry = Date.now() + ttl;
  cache.set(key, { value, expiry });
};

// Delete key from cache
const deleteKey = (key) => {
  cache.delete(key);
};

// Clear all cache entries
const clear = () => {
  cache.clear();
};

module.exports = {
  get,
  set,
  delete: deleteKey,
  clear
};