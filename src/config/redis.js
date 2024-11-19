const Redis = require('redis');
const logger = require('./logger');

const client = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const setupRedis = async () => {
  try {
    await client.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Redis connection error:', error);
  }
};

module.exports = { setupRedis, client };