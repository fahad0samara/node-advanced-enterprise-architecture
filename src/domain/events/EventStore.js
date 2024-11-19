const { EventEmitter } = require('events');
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  aggregateId: { type: String, required: true },
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  metadata: {
    userId: String,
    timestamp: { type: Date, default: Date.now },
    version: { type: Number, required: true }
  }
});

const Event = mongoose.model('Event', eventSchema);

class EventStore extends EventEmitter {
  async save(aggregateId, events, metadata = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const lastEvent = await Event.findOne({ aggregateId })
        .sort({ 'metadata.version': -1 })
        .select('metadata.version');

      const startVersion = lastEvent ? lastEvent.metadata.version + 1 : 1;

      const eventsToSave = events.map((event, index) => ({
        aggregateId,
        type: event.type,
        payload: event.payload,
        metadata: {
          ...metadata,
          version: startVersion + index,
          timestamp: new Date()
        }
      }));

      await Event.insertMany(eventsToSave, { session });
      await session.commitTransaction();

      events.forEach(event => this.emit(event.type, event));
      return eventsToSave;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getEvents(aggregateId, fromVersion = 0) {
    return Event.find({
      aggregateId,
      'metadata.version': { $gt: fromVersion }
    }).sort({ 'metadata.version': 1 });
  }
}

module.exports = new EventStore();