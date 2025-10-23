const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttl) {
  const expiresAt = ttl ? Date.now() + ttl : null;
  store.set(key, { value, expiresAt });
}

function clear() {
  store.clear();
}

module.exports = {
  get,
  set,
  clear,
};
