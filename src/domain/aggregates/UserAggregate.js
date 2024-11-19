const EventStore = require('../events/EventStore');
const { UserEvents } = require('../events/UserEvents');
const { AggregateError } = require('../errors');

class UserAggregate {
  constructor(id) {
    this.id = id;
    this.events = [];
    this.version = 0;
    this.changes = [];
  }

  async load() {
    const events = await EventStore.getEvents(this.id);
    events.forEach(event => this.apply(event, false));
    this.version = events.length;
    return this;
  }

  apply(event, isNew = true) {
    this.handleEvent(event);
    if (isNew) {
      this.changes.push(event);
    }
    this.version++;
  }

  handleEvent(event) {
    switch (event.type) {
      case UserEvents.CREATED:
        this.applyUserCreated(event.payload);
        break;
      case UserEvents.EMAIL_CHANGED:
        this.applyEmailChanged(event.payload);
        break;
      case UserEvents.ROLE_CHANGED:
        this.applyRoleChanged(event.payload);
        break;
      case UserEvents.ACCOUNT_LOCKED:
        this.applyAccountLocked(event.payload);
        break;
    }
  }

  async save(metadata = {}) {
    if (this.changes.length === 0) return;

    await EventStore.save(this.id, this.changes, metadata);
    this.changes = [];
  }

  createUser(data) {
    if (this.version !== 0) {
      throw new AggregateError('User already exists');
    }

    this.apply({
      type: UserEvents.CREATED,
      payload: data
    });
  }

  changeEmail(newEmail) {
    if (!this.email) {
      throw new AggregateError('User not initialized');
    }

    this.apply({
      type: UserEvents.EMAIL_CHANGED,
      payload: { oldEmail: this.email, newEmail }
    });
  }

  changeRole(newRole) {
    if (!this.role) {
      throw new AggregateError('User not initialized');
    }

    this.apply({
      type: UserEvents.ROLE_CHANGED,
      payload: { oldRole: this.role, newRole }
    });
  }

  lockAccount(reason) {
    if (this.isLocked) {
      throw new AggregateError('Account already locked');
    }

    this.apply({
      type: UserEvents.ACCOUNT_LOCKED,
      payload: { reason, timestamp: new Date() }
    });
  }

  // Event handlers
  applyUserCreated(data) {
    Object.assign(this, data);
  }

  applyEmailChanged({ newEmail }) {
    this.email = newEmail;
  }

  applyRoleChanged({ newRole }) {
    this.role = newRole;
  }

  applyAccountLocked({ reason, timestamp }) {
    this.isLocked = true;
    this.lockReason = reason;
    this.lockedAt = timestamp;
  }
}

module.exports = UserAggregate;