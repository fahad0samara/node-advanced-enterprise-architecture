require('dotenv').config();
require('module-alias/register');
require('reflect-metadata');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { useContainer, useExpressServer } = require('routing-controllers');
const { Container } = require('typedi');
const { createServer } = require('http');
const socketIO = require('socket.io');
const { connectDatabase } = require('@infrastructure/database/connection');
const { logger } = require('@infrastructure/logging');
const { setupMiddlewares } = require('@infrastructure/middleware');
const { setupSwagger } = require('@infrastructure/swagger');
const { QueueManager } = require('@infrastructure/queue/QueueManager');
const MetricsCollector = require('@infrastructure/telemetry/MetricsCollector');

// DI setup
useContainer(Container);

const app = express();
const httpServer = createServer(app);
const io = socketIO(httpServer);

// Core middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup application
setupMiddlewares(app);
setupSwagger(app);

// Queue dashboard
const queueManager = Container.get('queueManager');
app.use('/admin/queues', queueManager.getBullBoardMiddleware());

// Setup controllers
useExpressServer(app, {
  controllers: [__dirname + '/controllers/*.js'],
  middlewares: [__dirname + '/middleware/*.js'],
  interceptors: [__dirname + '/interceptors/*.js'],
  validation: true,
  defaultErrorHandler: false
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', MetricsCollector.getContentType());
  res.end(MetricsCollector.metrics());
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Queue dashboard available at http://localhost:${PORT}/admin/queues`);
      logger.info(`Metrics available at http://localhost:${PORT}/metrics`);
      logger.info(`API documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Error handling
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await queueManager.close();
  process.exit(0);
});

startServer();