const logger = require('../config/logger');

class Cache {
  constructor() {
    this.store = new Map();
    this.type = 'memory';
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }
  
  async get(key) {
    try {
      if (this.type === 'memory') {
        const item = this.store.get(key);
        
        if (!item) {
          this.stats.misses++;
          return null;
        }
        
        if (Date.now() > item.expiry) {
          this.store.delete(key);
          this.stats.misses++;
          return null;
        }
        
        this.stats.hits++;
        return item.value;
      }
      
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key, value, ttl = 300) {
    try {
      if (this.type === 'memory') {
        this.store.set(key, {
          value,
          expiry: Date.now() + (ttl * 1000)
        });
        this.stats.sets++;
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }
  
  async del(key) {
    try {
      if (this.type === 'memory') {
        const deleted = this.store.delete(key);
        if (deleted) this.stats.deletes++;
        return deleted;
      }
      
      return false;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }
  
  async delByPrefix(prefix) {
    try {
      if (this.type === 'memory') {
        let count = 0;
        for (const key of this.store.keys()) {
          if (key.startsWith(prefix)) {
            this.store.delete(key);
            count++;
          }
        }
        this.stats.deletes += count;
        return count > 0;
      }
      return false;
    } catch (error) {
      logger.error('Cache delByPrefix error:', error);
      return false;
    }
  }
  
  async clear() {
    try {
      if (this.type === 'memory') {
        this.store.clear();
        logger.info('Cache cleared');
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Cache clear error:', error);
      return false;
    }
  }
  
  async has(key) {
    try {
      if (this.type === 'memory') {
        const item = this.store.get(key);
        if (!item) return false;
        if (Date.now() > item.expiry) {
          this.store.delete(key);
          return false;
        }
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Cache has error:', error);
      return false;
    }
  }
  
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.store.size
    };
  }
  
  cleanup() {
    if (this.type === 'memory') {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, item] of this.store.entries()) {
        if (now > item.expiry) {
          this.store.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        logger.info(`Cache cleanup: removed ${cleaned} expired items`);
      }
    }
  }
}

const cache = new Cache();

setInterval(() => {
  cache.cleanup();
}, 60000);

module.exports = cache;
