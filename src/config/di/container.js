const { Container } = require('typedi');
const { UserService } = require('@services/UserService');
const { AuthService } = require('@services/AuthService');
const { CacheManager } = require('@infrastructure/cache/CacheManager');
const { QueueManager } = require('@infrastructure/queue/QueueManager');
const { MetricsService } = require('@services/MetricsService');
const { NotificationService } = require('@services/NotificationService');

// Register services
Container.set('userService', new UserService());
Container.set('authService', new AuthService());
Container.set('cacheManager', new CacheManager());
Container.set('queueManager', new QueueManager());
Container.set('metricsService', new MetricsService());
Container.set('notificationService', new NotificationService());

module.exports = Container;