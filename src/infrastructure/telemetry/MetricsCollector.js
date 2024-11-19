const { metrics, MeterProvider } = require('@opentelemetry/api');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { logger } = require('@infrastructure/logging');

class MetricsCollector {
  constructor() {
    this.meterProvider = new MeterProvider();
    this.setupExporter();
    this.meters = new Map();
    this.counters = new Map();
    this.histograms = new Map();
  }

  setupExporter() {
    const exporter = new PrometheusExporter({
      port: process.env.METRICS_PORT || 9464,
      endpoint: process.env.METRICS_ENDPOINT || '/metrics'
    });

    this.meterProvider.addMetricReader(exporter);
    metrics.setGlobalMeterProvider(this.meterProvider);
  }

  getMeter(name) {
    if (!this.meters.has(name)) {
      this.meters.set(name, this.meterProvider.getMeter(name));
    }
    return this.meters.get(name);
  }

  createCounter(name, options = {}) {
    const meter = this.getMeter(options.meterName || 'default');
    const counter = meter.createCounter(name, options);
    this.counters.set(name, counter);
    return counter;
  }

  createHistogram(name, options = {}) {
    const meter = this.getMeter(options.meterName || 'default');
    const histogram = meter.createHistogram(name, options);
    this.histograms.set(name, histogram);
    return histogram;
  }

  incrementCounter(name, value = 1, attributes = {}) {
    try {
      const counter = this.counters.get(name);
      if (counter) {
        counter.add(value, attributes);
      } else {
        logger.warn(`Counter ${name} not found`);
      }
    } catch (error) {
      logger.error(`Error incrementing counter ${name}:`, error);
    }
  }

  recordHistogram(name, value, attributes = {}) {
    try {
      const histogram = this.histograms.get(name);
      if (histogram) {
        histogram.record(value, attributes);
      } else {
        logger.warn(`Histogram ${name} not found`);
      }
    } catch (error) {
      logger.error(`Error recording histogram ${name}:`, error);
    }
  }
}

module.exports = new MetricsCollector();