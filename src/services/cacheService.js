const redis = require('redis');
const logger = require('./logger');

/**
 * Redis Cache Service - Production-grade caching with TTL management
 */
class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.TTL = {
      SHORT: 5 * 60, // 5 minutes
      MEDIUM: 30 * 60, // 30 minutes
      LONG: 24 * 60 * 60, // 24 hours
      VERY_LONG: 7 * 24 * 60 * 60, // 7 days
    };
  }

  async initialize() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
      });

      this.client.on('ready', () => {
        this.connected = true;
        logger.info('Redis cache connected');
      });

      this.client.on('error', (err) => {
        this.connected = false;
        logger.error(`Redis error: ${err.message}`);
      });
    } catch (error) {
      logger.error(`Failed to initialize Redis: ${error.message}`);
      throw error;
    }
  }

  isConnected() {
    return this.connected && this.client !== null;
  }

  async get(key) {
    if (!this.isConnected()) return null;
    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key, value, ttl = this.TTL.MEDIUM) {
    if (!this.isConnected()) return false;
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      logger.debug(`Cache SET: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache set error for ${key}: ${error.message}`);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected()) return false;
    try {
      await this.client.del(key);
      logger.debug(`Cache DELETE: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for ${key}: ${error.message}`);
      return false;
    }
  }

  async delPattern(pattern) {
    if (!this.isConnected()) return 0;
    try {
      const keys = await this.keys(pattern);
      if (keys.length === 0) return 0;
      await this.client.del(...keys);
      logger.debug(`Cache DELETE PATTERN: ${pattern}`);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error: ${error.message}`);
      return 0;
    }
  }

  async exists(key) {
    if (!this.isConnected()) return false;
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      return false;
    }
  }

  async keys(pattern) {
    if (!this.isConnected()) return [];
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error(`Cache keys error: ${error.message}`);
      return [];
    }
  }

  async clear() {
    if (!this.isConnected()) return false;
    try {
      await this.client.flushdb();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error(`Cache clear error: ${error.message}`);
      return false;
    }
  }

  async getOrCompute(key, computeFn, ttl = this.TTL.MEDIUM) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    try {
      const value = await computeFn();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error(`Cache getOrCompute error: ${error.message}`);
      throw error;
    }
  }

  async expire(key, ttl) {
    if (!this.isConnected()) return false;
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected()) return -2;
    try {
      return await this.client.ttl(key);
    } catch (error) {
      return -2;
    }
  }

  async close() {
    if (this.client) {
      try {
        this.client.quit();
        this.connected = false;
        logger.info('Redis cache connection closed');
      } catch (error) {
        logger.error(`Error closing Redis: ${error.message}`);
      }
    }
  }
}

const cacheService = new CacheService();
module.exports = cacheService;
