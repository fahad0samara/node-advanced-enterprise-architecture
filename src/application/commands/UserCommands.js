const UserAggregate = require('../../domain/aggregates/UserAggregate');
const { CommandBus } = require('../CommandBus');
const { validate } = require('../validation');
const { CommandError } = require('../errors');

class CreateUserCommand {
  static validate(payload) {
    return validate(payload, {
      email: 'required|email',
      password: 'required|min:8',
      role: 'required|in:user,admin'
    });
  }

  static async execute(payload, metadata) {
    const user = new UserAggregate(payload.id);
    user.createUser(payload);
    await user.save(metadata);
    return user;
  }
}

class ChangeUserEmailCommand {
  static validate(payload) {
    return validate(payload, {
      userId: 'required',
      newEmail: 'required|email'
    });
  }

  static async execute(payload, metadata) {
    const user = new UserAggregate(payload.userId);
    await user.load();
    user.changeEmail(payload.newEmail);
    await user.save(metadata);
    return user;
  }
}

class LockUserAccountCommand {
  static validate(payload) {
    return validate(payload, {
      userId: 'required',
      reason: 'required|string'
    });
  }

  static async execute(payload, metadata) {
    const user = new UserAggregate(payload.userId);
    await user.load();
    user.lockAccount(payload.reason);
    await user.save(metadata);
    return user;
  }
}

// Register commands
CommandBus.register('CreateUser', CreateUserCommand);
CommandBus.register('ChangeUserEmail', ChangeUserEmailCommand);
CommandBus.register('LockUserAccount', LockUserAccountCommand);

module.exports = {
  CreateUserCommand,
  ChangeUserEmailCommand,
  LockUserAccountCommand
};