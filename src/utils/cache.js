class Cache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return null;
  }

  set(key, value, ttl = 300000) {
    // Placeholder
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new Cache();
module.exports = cache;