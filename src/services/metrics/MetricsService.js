const { metrics } = require('@opentelemetry/api');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { logger } = require('@infrastructure/logging');

class MetricsService {
  constructor() {
    this.metrics = new Map();
    this.setupExporter();
  }

  setupExporter() {
    this.exporter = new PrometheusExporter({
      port: process.env.METRICS_PORT || 9464,
      endpoint: '/metrics'
    });
  }

  trackRequest(path, method, statusCode, duration) {
    const key = `http_request_${method.toLowerCase()}`;
    this.recordMetric(key, {
      value: duration,
      labels: { path, status: statusCode }
    });
  }

  trackDatabaseOperation(operation, collection, duration) {
    this.recordMetric('database_operation', {
      value: duration,
      labels: { operation, collection }
    });
  }

  trackCacheOperation(operation, success) {
    this.recordMetric('cache_operation', {
      value: 1,
      labels: { operation, success }
    });
  }

  trackAuthEvent(type, success) {
    this.recordMetric('auth_event', {
      value: 1,
      labels: { type, success }
    });
  }

  recordMetric(name, { value, labels = {} }) {
    try {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, metrics.getMetric(name) || 
          metrics.createMetric(name, {
            description: `Metric for ${name}`,
            unit: 'ms',
            type: 'histogram'
          })
        );
      }

      const metric = this.metrics.get(name);
      metric.record(value, labels);
    } catch (error) {
      logger.error(`Error recording metric ${name}:`, error);
    }
  }

  getMetrics() {
    return this.exporter.getMetrics();
  }
}

module.exports = MetricsService;