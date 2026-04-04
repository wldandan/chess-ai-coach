/**
 * Chess Gamification Agent
 */

const TITLES = [
  { id: 'first_review', name: '初出茅庐', icon: '🏅', condition: p => p.stats.totalGames >= 1 },
  { id: 'blunder_hunter', name: '漏着猎人', icon: '🔍', condition: p => p.stats.blunders >= 10 },
  { id: 'brilliant_master', name: '妙着大师', icon: '✨', condition: p => p.stats.brilliants >= 5 },
  { id: 'winning_streak', name: '连胜达人', icon: '🔥', condition: p => p.stats.wins >= 10 },
  { id: 'chess_master', name: '棋王', icon: '👑', condition: p => p.xp >= 1000 },
];

const ACHIEVEMENTS = [
  { id: 'perfect_game', name: '完美之局', description: '准确率 100%', icon: '🎯', condition: p => p.stats.totalGames >= 1 },
  { id: 'comeback', name: '逆转胜利', description: '落后情况下翻盘', icon: '🌟', condition: p => p.stats.wins >= 1 },
];

class ChessGamificationAgent {
  constructor() {
    this.profiles = new Map();
    this.profiles.set('default', this.createDefaultProfile('default'));
  }

  getMockProfile(userId) {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, this.createDefaultProfile(userId));
    }
    return this.profiles.get(userId);
  }

  update(input) {
    console.log(`[Gamification] Updating for ${input.userId}...`);
    const profile = this.getMockProfile(input.userId);

    const xpGained = this.calculateXP(input);

    const updatedStats = {
      totalGames: profile.stats.totalGames + 1,
      wins: profile.stats.wins + (input.isWin ? 1 : 0),
      losses: profile.stats.losses + (input.isWin ? 0 : 1),
      draws: profile.stats.draws,
      brilliants: profile.stats.brilliants + input.brilliantsCount,
      blunders: profile.stats.blunders + input.blundersCount,
    };

    const newTitles = this.checkTitles(profile, updatedStats);
    const newAchievements = this.checkAchievements(profile, updatedStats);

    const newXp = profile.xp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;
    const updatedRadar = this.updateRadar(profile, input);

    const updatedProfile = {
      ...profile,
      xp: newXp,
      level: newLevel,
      streak: this.updateStreak(profile),
      stats: updatedStats,
      radar: updatedRadar,
      titles: [...profile.titles, ...newTitles],
      achievements: [...profile.achievements, ...newAchievements],
      lastReviewDate: new Date().toISOString().split('T')[0],
    };

    this.profiles.set(input.userId, updatedProfile);

    const radarData = {
      labels: ['开局', '中盘', '残局', '防守', '进攻'],
      values: [
        Math.round(updatedRadar.opening * 5),
        Math.round(updatedRadar.middlegame * 5),
        Math.round(updatedRadar.endgame * 5),
        Math.round(updatedRadar.defense * 5),
        Math.round(updatedRadar.attack * 5),
      ],
    };

    return { xpGained, newTitles, newAchievements, radarData, updatedProfile };
  }

  calculateXP(input) {
    let xp = 10;
    if (input.isWin) xp += 5;
    if (input.accuracy >= 80) xp += 3;
    xp += input.brilliantsCount * 2;
    if (input.blundersCount < 2) xp += 2;
    return xp;
  }

  checkTitles(profile, stats) {
    const newTitles = [];
    const now = new Date().toISOString();
    for (const title of TITLES) {
      if (profile.titles.some(t => t.id === title.id)) continue;
      if (title.condition({ ...profile, stats })) {
        newTitles.push({ id: title.id, name: title.name, icon: title.icon, unlockedAt: now });
        console.log(`[Gamification] New title: ${title.name}`);
      }
    }
    return newTitles;
  }

  checkAchievements(profile, stats) {
    const newAchievements = [];
    const now = new Date().toISOString();
    for (const achievement of ACHIEVEMENTS) {
      if (profile.achievements.some(a => a.id === achievement.id)) continue;
      if (achievement.condition({ ...profile, stats })) {
        newAchievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          unlockedAt: now,
        });
        console.log(`[Gamification] New achievement: ${achievement.name}`);
      }
    }
    return newAchievements;
  }

  updateRadar(profile, input) {
    const adjustment = input.accuracy / 100;
    const blunderPenalty = input.blundersCount * 0.02;
    const brilliantBonus = input.brilliantsCount * 0.03;
    return {
      opening: Math.min(1, profile.radar.opening * 0.9 + adjustment * 0.1),
      middlegame: Math.min(1, profile.radar.middlegame * 0.9 + (adjustment - blunderPenalty + brilliantBonus) * 0.1),
      endgame: Math.min(1, profile.radar.endgame * 0.9 + adjustment * 0.1),
      defense: Math.min(1, profile.radar.defense * 0.9 + (adjustment - blunderPenalty) * 0.1),
      attack: Math.min(1, profile.radar.attack * 0.9 + (adjustment + brilliantBonus) * 0.1),
    };
  }

  updateStreak(profile) {
    const today = new Date().toISOString().split('T')[0];
    const lastReview = profile.lastReviewDate;
    if (!lastReview) return 1;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (lastReview === today) return profile.streak;
    if (lastReview === yesterdayStr) return profile.streak + 1;
    return 1;
  }

  createDefaultProfile(userId) {
    return {
      userId,
      xp: 0,
      level: 1,
      streak: 0,
      titles: [],
      achievements: [],
      stats: { totalGames: 0, wins: 0, losses: 0, draws: 0, brilliants: 0, blunders: 0 },
      radar: { opening: 0.7, middlegame: 0.7, endgame: 0.7, defense: 0.7, attack: 0.7 },
    };
  }
}

module.exports = { ChessGamificationAgent };
