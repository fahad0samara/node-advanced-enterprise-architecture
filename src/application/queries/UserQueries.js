const { QueryBus } = require('../QueryBus');
const CacheManager = require('../../infrastructure/cache/CacheManager');
const UserRepository = require('../../infrastructure/repositories/UserRepository');

class GetUserProfileQuery {
  static async execute({ userId }) {
    return CacheManager.get(
      `user:${userId}:profile`,
      async () => UserRepository.findById(userId),
      { ttl: 1800, staleWhileRevalidate: true }
    );
  }
}

class SearchUsersQuery {
  static async execute({ criteria, page = 1, limit = 20 }) {
    const cacheKey = `users:search:${JSON.stringify(criteria)}:${page}:${limit}`;
    
    return CacheManager.get(
      cacheKey,
      async () => UserRepository.search(criteria, { page, limit }),
      { ttl: 300 }
    );
  }
}

class GetUserActivityQuery {
  static async execute({ userId, startDate, endDate }) {
    const cacheKey = `user:${userId}:activity:${startDate}:${endDate}`;
    
    return CacheManager.get(
      cacheKey,
      async () => UserRepository.getActivity(userId, startDate, endDate),
      { ttl: 3600 }
    );
  }
}

// Register queries
QueryBus.register('GetUserProfile', GetUserProfileQuery);
QueryBus.register('SearchUsers', SearchUsersQuery);
QueryBus.register('GetUserActivity', GetUserActivityQuery);

module.exports = {
  GetUserProfileQuery,
  SearchUsersQuery,
  GetUserActivityQuery
};