const cache = new Map();

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

const set = (key, value, ttl = 300000) => {
  const expiry = Date.now() + ttl;
  cache.set(key, { value, expiry });
};

const deleteKey = (key) => {
  cache.delete(key);
};

const clear = () => {
  cache.clear();
};

/*
This is an local cache, not a distributed cache already implemented
understand this and implement a local cache system out of it with ttl
*/

module.exports = {
  get,
  set,
  delete: deleteKey,
  clear
};