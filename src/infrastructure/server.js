require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDatabase } = require('./database/connection');
const { logger } = require('./logging');
const NotificationService = require('./realtime/NotificationService');
const AchievementSystem = require('../domain/gamification/AchievementSystem');
const routes = require('../routes');
const errorHandler = require('../middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Initialize services
const notificationService = new NotificationService(io);

// Achievement system event handling
AchievementSystem.on('achievements_unlocked', async ({ userId, achievements }) => {
  for (const achievement of achievements) {
    await notificationService.sendAchievementNotification(userId, achievement);
  }
});

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Database connection
connectDatabase().then(() => {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

module.exports = app;