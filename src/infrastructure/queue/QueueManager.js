const { Queue, Worker } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { logger } = require('@infrastructure/logging');

class QueueManager {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.serverAdapter = new ExpressAdapter();
    this.setupBullBoard();
  }

  setupBullBoard() {
    const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
      queues: [],
      serverAdapter: this.serverAdapter
    });

    this.bullBoard = {
      addQueue,
      removeQueue,
      setQueues,
      replaceQueues
    };
  }

  createQueue(name, options = {}) {
    const queue = new Queue(name, {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      },
      ...options
    });

    this.queues.set(name, queue);
    this.bullBoard.addQueue(new BullMQAdapter(queue));
    return queue;
  }

  createWorker(queueName, processor, options = {}) {
    const worker = new Worker(queueName, processor, {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      },
      ...options
    });

    worker.on('completed', job => {
      logger.info(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue ${queueName}:`, err);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  async addJob(queueName, data, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(queueName, data, options);
  }

  getQueue(name) {
    return this.queues.get(name);
  }

  getWorker(name) {
    return this.workers.get(name);
  }

  getBullBoardMiddleware() {
    return this.serverAdapter.getRouter();
  }

  async close() {
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

module.exports = QueueManager;