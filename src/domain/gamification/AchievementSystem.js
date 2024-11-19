const { EventEmitter } = require('events');

class AchievementSystem extends EventEmitter {
  constructor() {
    super();
    this.achievements = new Map();
    this.userProgress = new Map();
    this.initializeAchievements();
  }

  initializeAchievements() {
    this.registerAchievement('first_login', {
      title: 'Welcome Aboard!',
      description: 'Login for the first time',
      points: 10,
      icon: '🎉'
    });

    this.registerAchievement('profile_complete', {
      title: 'Identity Established',
      description: 'Complete your profile information',
      points: 20,
      icon: '📝'
    });

    this.registerAchievement('social_butterfly', {
      title: 'Social Butterfly',
      description: 'Connect with 5 other users',
      points: 30,
      icon: '🦋'
    });

    this.registerAchievement('power_user', {
      title: 'Power User',
      description: 'Use the app for 7 consecutive days',
      points: 50,
      icon: '⚡'
    });
  }

  registerAchievement(id, details) {
    this.achievements.set(id, {
      id,
      ...details,
      check: this.getAchievementChecker(id)
    });
  }

  getAchievementChecker(id) {
    const checkers = {
      first_login: (user) => user.loginCount === 1,
      profile_complete: (user) => this.isProfileComplete(user),
      social_butterfly: (user) => user.connections >= 5,
      power_user: (user) => this.checkConsecutiveDays(user)
    };
    return checkers[id] || (() => false);
  }

  async checkAchievements(userId, context) {
    const userProgress = this.getUserProgress(userId);
    const unlockedAchievements = [];

    for (const [id, achievement] of this.achievements) {
      if (!userProgress.completed.includes(id) && achievement.check(context)) {
        unlockedAchievements.push(achievement);
        userProgress.completed.push(id);
        userProgress.points += achievement.points;
      }
    }

    if (unlockedAchievements.length > 0) {
      this.userProgress.set(userId, userProgress);
      this.emit('achievements_unlocked', { userId, achievements: unlockedAchievements });
    }

    return unlockedAchievements;
  }

  getUserProgress(userId) {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, { completed: [], points: 0 });
    }
    return this.userProgress.get(userId);
  }

  isProfileComplete(user) {
    const requiredFields = ['name', 'avatar', 'bio', 'location'];
    return requiredFields.every(field => user[field]);
  }

  checkConsecutiveDays(user) {
    const now = new Date();
    const streak = user.loginDates
      .sort((a, b) => b - a)
      .reduce((acc, date) => {
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        return diff === acc.days ? { days: acc.days + 1, streak: acc.streak + 1 }
          : diff === acc.days + 1 ? { days: diff, streak: 1 }
          : acc;
      }, { days: 0, streak: 0 });

    return streak.streak >= 7;
  }
}

module.exports = new AchievementSystem();