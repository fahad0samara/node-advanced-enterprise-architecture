const socketIO = require('socket.io');
const Redis = require('ioredis');
const { createCanvas, loadImage } = require('canvas');

class NotificationService {
  constructor(io) {
    this.io = io;
    this.redis = new Redis(process.env.REDIS_URL);
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth.userId;
      if (userId) {
        socket.join(`user:${userId}`);
        this.sendWelcomeNotification(socket);
      }

      socket.on('notification:read', async (notificationId) => {
        await this.markAsRead(userId, notificationId);
      });
    });
  }

  async sendNotification(userId, notification) {
    const enrichedNotification = await this.enrichNotification(notification);
    this.io.to(`user:${userId}`).emit('notification:new', enrichedNotification);
    await this.storeNotification(userId, enrichedNotification);
  }

  async sendAchievementNotification(userId, achievement) {
    const canvas = createCanvas(400, 200);
    const ctx = canvas.getContext('2d');
    
    // Create achievement card
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 400, 200);
    
    // Add achievement icon
    ctx.font = '48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(achievement.icon, 20, 100);
    
    // Add text
    ctx.font = '24px Arial';
    ctx.fillText(achievement.title, 100, 80);
    ctx.font = '16px Arial';
    ctx.fillText(achievement.description, 100, 110);
    ctx.fillText(`+${achievement.points} points`, 100, 140);
    
    const imageBuffer = canvas.toBuffer('image/png');
    
    await this.sendNotification(userId, {
      type: 'achievement',
      title: 'New Achievement Unlocked! 🏆',
      message: `You've earned "${achievement.title}"`,
      image: imageBuffer.toString('base64'),
      data: achievement
    });
  }

  async enrichNotification(notification) {
    return {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification
    };
  }

  async storeNotification(userId, notification) {
    const key = `notifications:${userId}`;
    await this.redis.lpush(key, JSON.stringify(notification));
    await this.redis.ltrim(key, 0, 99); // Keep last 100 notifications
  }

  async markAsRead(userId, notificationId) {
    const key = `notifications:${userId}`;
    const notifications = await this.redis.lrange(key, 0, -1);
    
    const updatedNotifications = notifications.map(n => {
      const notification = JSON.parse(n);
      if (notification.id === notificationId) {
        notification.read = true;
      }
      return JSON.stringify(notification);
    });

    await this.redis.del(key);
    if (updatedNotifications.length > 0) {
      await this.redis.rpush(key, ...updatedNotifications);
    }
  }

  async sendWelcomeNotification(socket) {
    const notification = {
      type: 'welcome',
      title: 'Welcome Back! 👋',
      message: 'Great to see you again!',
      priority: 'low'
    };
    socket.emit('notification:new', await this.enrichNotification(notification));
  }
}

module.exports = NotificationService;