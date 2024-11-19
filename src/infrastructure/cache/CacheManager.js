const Redis = require('ioredis');
const { logger } = require('../logging');

class CacheManager {
  constructor() {
    this.client = new Redis(process.env.REDIS_URL, {
      keyPrefix: 'cache:',
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });

    this.client.on('error', (error) => {
      logger.error('Cache error:', error);
    });
  }

  async get(key, fetchFn, options = {}) {
    const {
      ttl = 3600,
      staleWhileRevalidate = false,
      useStale = true
    } = options;

    const cacheKey = `${key}:data`;
    const staleKey = `${key}:stale`;

    try {
      // Try to get fresh data
      const cachedData = await this.client.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Check for stale data if enabled
      if (useStale) {
        const staleData = await this.client.get(staleKey);
        if (staleData) {
          if (staleWhileRevalidate) {
            this.refreshCache(key, fetchFn, ttl).catch(err => 
              logger.error('Background cache refresh failed:', err)
            );
          }
          return JSON.parse(staleData);
        }
      }

      // Fetch fresh data
      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);
      return freshData;
    } catch (error) {
      logger.error('Cache operation failed:', error);
      return fetchFn();
    }
  }

  async set(key, data, ttl = 3600) {
    const serialized = JSON.stringify(data);
    const multi = this.client.multi();

    multi.set(`${key}:data`, serialized, 'EX', ttl);
    multi.set(`${key}:stale`, serialized, 'EX', ttl * 2);

    return multi.exec();
  }

  async invalidate(pattern) {
    const keys = await this.client.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
      return this.client.del(keys);
    }
  }

  async refreshCache(key, fetchFn, ttl) {
    try {
      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);
    } catch (error) {
      logger.error('Cache refresh failed:', error);
    }
  }
}

module.exports = new CacheManager();