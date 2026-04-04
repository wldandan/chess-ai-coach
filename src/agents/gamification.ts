/**
 * Chess Gamification Agent
 * 
 * XP/称号/成就/雷达图系统
 */

export interface Title {
  id: string;
  name: string;
  icon: string;
  unlockedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

export interface RadarData {
  labels: string[];
  values: number[];
}

export interface UserProfile {
  userId: string;
  xp: number;
  level: number;
  streak: number;
  titles: Title[];
  achievements: Achievement[];
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    brilliants: number;
    blunders: number;
  };
  radar: {
    opening: number;
    middlegame: number;
    endgame: number;
    defense: number;
    attack: number;
  };
  lastReviewDate?: string;
}

export interface GamificationResult {
  xpGained: number;
  newTitles: Title[];
  newAchievements: Achievement[];
  radarData: RadarData;
  updatedProfile: UserProfile;
}

// 称号定义
const TITLES = [
  { id: 'first_review', name: '初出茅庐', icon: '🏅', condition: (p: UserProfile) => p.stats.totalGames >= 1 },
  { id: 'blunder_hunter', name: '漏着猎人', icon: '🔍', condition: (p: UserProfile) => p.stats.blunders >= 10 },
  { id: 'brilliant_master', name: '妙着大师', icon: '✨', condition: (p: UserProfile) => p.stats.brilliants >= 5 },
  { id: 'winning_streak', name: '连胜达人', icon: '🔥', condition: (p: UserProfile) => p.stats.wins >= 10 },
  { id: 'chess_master', name: '棋王', icon: '👑', condition: (p: UserProfile) => p.xp >= 1000 },
];

// 成就定义
const ACHIEVEMENTS = [
  { id: 'perfect_game', name: '完美之局', description: '准确率 100%', icon: '🎯', condition: (p: UserProfile) => p.stats.totalGames >= 1 },
  { id: 'comeback', name: '逆转胜利', description: '落后情况下翻盘', icon: '🌟', condition: (p: UserProfile) => p.stats.wins >= 1 },
];

export class ChessGamificationAgent {
  // 模拟用户数据库
  private profiles: Map<string, UserProfile> = new Map();

  constructor() {
    // 初始化一些 mock 数据
    this.profiles.set('default', this.createDefaultProfile('default'));
  }

  /**
   * 获取用户档案（没有则创建默认）
   */
  getMockProfile(userId: string): UserProfile {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, this.createDefaultProfile(userId));
    }
    return this.profiles.get(userId)!;
  }

  /**
   * 更新游戏化数据
   */
  update(input: {
    userId: string;
    isWin: boolean;
    accuracy: number;
    brilliantsCount: number;
    blundersCount: number;
  }): GamificationResult {
    console.log(`[Gamification] Updating for ${input.userId}...`);

    const profile = this.getMockProfile(input.userId);

    // 计算 XP
    const xpGained = this.calculateXP(input);
    console.log(`[Gamification] XP gained: ${xpGained}`);

    // 更新统计
    const updatedStats = {
      totalGames: profile.stats.totalGames + 1,
      wins: profile.stats.wins + (input.isWin ? 1 : 0),
      losses: profile.stats.losses + (input.isWin ? 0 : 1),
      draws: profile.stats.draws,
      brilliants: profile.stats.brilliants + input.brilliantsCount,
      blunders: profile.stats.blunders + input.blundersCount,
    };

    // 检查新称号
    const newTitles = this.checkTitles(profile, updatedStats);

    // 检查新成就
    const newAchievements = this.checkAchievements(profile, updatedStats);

    // 计算新等级
    const newXp = profile.xp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;

    // 更新雷达图
    const updatedRadar = this.updateRadar(profile, input);

    // 更新档案
    const updatedProfile: UserProfile = {
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

    // 计算雷达图数据
    const radarData: RadarData = {
      labels: ['开局', '中盘', '残局', '防守', '进攻'],
      values: [
        Math.round(updatedRadar.opening * 5),
        Math.round(updatedRadar.middlegame * 5),
        Math.round(updatedRadar.endgame * 5),
        Math.round(updatedRadar.defense * 5),
        Math.round(updatedRadar.attack * 5),
      ],
    };

    return {
      xpGained,
      newTitles,
      newAchievements,
      radarData,
      updatedProfile,
    };
  }

  /**
   * 计算 XP
   */
  private calculateXP(input: { isWin: boolean; accuracy: number; brilliantsCount: number; blundersCount: number; }): number {
    let xp = 10; // 基础 XP

    if (input.isWin) xp += 5; // 胜利加成
    if (input.accuracy >= 80) xp += 3; // 准确率加成
    xp += input.brilliantsCount * 2; // 妙着加成
    if (input.blundersCount < 2) xp += 2; // 少漏着加成

    return xp;
  }

  /**
   * 检查新称号
   */
  private checkTitles(profile: UserProfile, stats: UserProfile['stats']): Title[] {
    const newTitles: Title[] = [];
    const now = new Date().toISOString();

    for (const title of TITLES) {
      // 检查是否已解锁
      if (profile.titles.some(t => t.id === title.id)) continue;
      // 检查是否满足条件
      if (title.condition({ ...profile, stats })) {
        newTitles.push({
          id: title.id,
          name: title.name,
          icon: title.icon,
          unlockedAt: now,
        });
        console.log(`[Gamification] New title unlocked: ${title.name}`);
      }
    }

    return newTitles;
  }

  /**
   * 检查新成就
   */
  private checkAchievements(profile: UserProfile, stats: UserProfile['stats']): Achievement[] {
    const newAchievements: Achievement[] = [];
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
        console.log(`[Gamification] New achievement unlocked: ${achievement.name}`);
      }
    }

    return newAchievements;
  }

  /**
   * 更新雷达图
   */
  private updateRadar(profile: UserProfile, input: { accuracy: number; brilliantsCount: number; blundersCount: number; }): UserProfile['radar'] {
    // 简化：基于准确率和漏着/妙着调整
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

  /**
   * 更新连续复盘天数
   */
  private updateStreak(profile: UserProfile): number {
    const today = new Date().toISOString().split('T')[0];
    const lastReview = profile.lastReviewDate;

    if (!lastReview) return 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastReview === today) return profile.streak; // 今天已复盘
    if (lastReview === yesterdayStr) return profile.streak + 1; // 连续

    return 1; // 断了
  }

  /**
   * 创建默认档案
   */
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      xp: 0,
      level: 1,
      streak: 0,
      titles: [],
      achievements: [],
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        brilliants: 0,
        blunders: 0,
      },
      radar: {
        opening: 0.7,
        middlegame: 0.7,
        endgame: 0.7,
        defense: 0.7,
        attack: 0.7,
      },
    };
  }
}
