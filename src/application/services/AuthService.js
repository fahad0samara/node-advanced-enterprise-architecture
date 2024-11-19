const jwt = require('jsonwebtoken');
const { Redis } = require('ioredis');
const UserRepository = require('../repositories/UserRepository');
const { AuthenticationError, ValidationError } = require('../errors');
const { logger } = require('../../infrastructure/logging');
const { sendEmail } = require('../../infrastructure/email');

class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async register(userData) {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const user = await this.userRepository.create(userData);
    await this.sendWelcomeEmail(user);
    
    return this.generateTokens(user);
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new AuthenticationError('Account is temporarily locked');
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      throw new AuthenticationError('Invalid credentials');
    }

    await this.userRepository.update(user.id, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockUntil: null
    });

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken) {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await this.userRepository.findById(payload.id);
    
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const storedToken = await this.redis.get(`refresh_token:${user.id}`);
    if (storedToken !== refreshToken) {
      throw new AuthenticationError('Invalid refresh token');
    }

    return this.generateTokens(user);
  }

  async logout(userId, accessToken) {
    await Promise.all([
      this.redis.del(`refresh_token:${userId}`),
      this.redis.setex(`blacklist:${accessToken}`, 24 * 60 * 60, '1')
    ]);
  }

  async generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await this.redis.setex(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  async sendWelcomeEmail(user) {
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to our platform',
        template: 'welcome',
        context: { name: user.email.split('@')[0] }
      });
    } catch (error) {
      logger.error('Failed to send welcome email', { error, userId: user.id });
    }
  }
}