const { Queue, Worker } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { logger } = require('@infrastructure/logging');

class QueueService {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.serverAdapter = new ExpressAdapter();
    this.setupBullBoard();
    this.initializeDefaultQueues();
  }

  setupBullBoard() {
    const { addQueue, removeQueue, setQueues } = createBullBoard({
      queues: [],
      serverAdapter: this.serverAdapter
    });

    this.bullBoard = { addQueue, removeQueue, setQueues };
  }

  initializeDefaultQueues() {
    this.createQueue('email', this.processEmailQueue);
    this.createQueue('notification', this.processNotificationQueue);
    this.createQueue('analytics', this.processAnalyticsQueue);
    this.createQueue('cleanup', this.processCleanupQueue);
  }

  createQueue(name, processor, options = {}) {
    const queue = new Queue(name, {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      },
      ...options
    });

    const worker = new Worker(name, processor, {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    });

    this.setupWorkerEvents(worker, name);
    
    this.queues.set(name, queue);
    this.workers.set(name, worker);
    this.bullBoard.addQueue(new BullMQAdapter(queue));
    
    return queue;
  }

  setupWorkerEvents(worker, queueName) {
    worker.on('completed', job => {
      logger.info(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue ${queueName}:`, err);
    });

    worker.on('error', err => {
      logger.error(`Worker error in queue ${queueName}:`, err);
    });
  }

  async addJob(queueName, data, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(queueName, data, options);
  }

  async processEmailQueue(job) {
    // Email processing logic
    logger.info(`Processing email job ${job.id}`);
  }

  async processNotificationQueue(job) {
    // Notification processing logic
    logger.info(`Processing notification job ${job.id}`);
  }

  async processAnalyticsQueue(job) {
    // Analytics processing logic
    logger.info(`Processing analytics job ${job.id}`);
  }

  async processCleanupQueue(job) {
    // Cleanup processing logic
    logger.info(`Processing cleanup job ${job.id}`);
  }

  getQueueMetrics(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return queue.getMetrics();
  }

  getBullBoardMiddleware() {
    return this.serverAdapter.getRouter();
  }

  async gracefulShutdown() {
    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info(`Worker ${name} closed`);
    }

    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${name} closed`);
    }
  }
}

module.exports = QueueService;