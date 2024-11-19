class UserLevel {
  constructor() {
    this.levels = [
      { level: 1, minPoints: 0, title: "Novice" },
      { level: 2, minPoints: 100, title: "Explorer" },
      { level: 3, minPoints: 300, title: "Enthusiast" },
      { level: 4, minPoints: 600, title: "Expert" },
      { level: 5, minPoints: 1000, title: "Master" }
    ];
  }

  calculateLevel(points) {
    const level = this.levels
      .slice()
      .reverse()
      .find(l => points >= l.minPoints);
    
    const nextLevel = this.levels.find(l => l.minPoints > points);
    const progress = nextLevel 
      ? (points - level.minPoints) / (nextLevel.minPoints - level.minPoints)
      : 1;

    return {
      ...level,
      progress,
      nextLevel: nextLevel?.title || null,
      pointsToNext: nextLevel ? nextLevel.minPoints - points : 0
    };
  }
}

module.exports = new UserLevel();