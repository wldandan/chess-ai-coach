/**
 * 用户档案与等级系统
 * XP → Level 转换、称号系统、成就定义
 */

// ============== 等级系统 ==============
export const LEVEL_THRESHOLDS = [
  { level: 1, minXP: 0, maxXP: 99, name: 'Chess Pupil' },
  { level: 2, minXP: 100, maxXP: 299, name: 'Chess Learner' },
  { level: 3, minXP: 300, maxXP: 599, name: 'Chess Player' },
  { level: 4, minXP: 600, maxXP: 999, name: 'Chess Specialist' },
  { level: 5, minXP: 1000, maxXP: Infinity, name: 'Chess Master' },
] as const;

export type LevelName = typeof LEVEL_THRESHOLDS[number]['name'];

/**
 * XP → Level 计算
 */
export function xpToLevel(xp: number): number {
  for (const tier of LEVEL_THRESHOLDS) {
    if (xp >= tier.minXP && xp <= tier.maxXP) {
      return tier.level;
    }
  }
  return 1;
}

/**
 * 获取等级名称
 */
export function getLevelName(level: number): LevelName {
  const tier = LEVEL_THRESHOLDS.find(t => t.level === level);
  return tier?.name ?? 'Chess Pupil';
}

/**
 * 获取当前等级的进度百分比
 */
export function getLevelProgress(xp: number): { current: number; required: number; percent: number } {
  const level = xpToLevel(xp);
  const tier = LEVEL_THRESHOLDS.find(t => t.level === level);
  if (!tier || tier.maxXP === Infinity) {
    return { current: xp - tier!.minXP, required: 100, percent: 100 };
  }
  const current = xp - tier.minXP;
  const required = tier.maxXP - tier.minXP + 1;
  return { current, required, percent: Math.round((current / required) * 100) };
}

// ============== 称号系统 ==============
export interface Title {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const TITLES: Title[] = [
  { id: 'first_review', name: '初出茅庐', icon: '🏅', description: '完成第 1 次复盘' },
  { id: 'blunder_hunter', name: '漏着猎人', icon: '🔍', description: '累计发现 10 个对手漏着' },
  { id: 'brilliant_master', name: '妙着大师', icon: '✨', description: '累计做出 5 个妙着' },
  { id: 'win_streak', name: '连胜达人', icon: '🔥', description: '累计赢得 10 局' },
  { id: 'chess_king', name: '棋王', icon: '👑', description: '达到 2000+ rating' },
];

// ============== 成就系统 ==============
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_review', name: '初出茅庐', description: '完成第一次复盘', icon: '🎯' },
  { id: 'first_win', name: '首胜', description: '赢得第一局', icon: '🏆' },
  { id: 'ten_games', name: '常客', description: '累计复盘 10 局', icon: '📊' },
  { id: 'fifty_games', name: '老手', description: '累计复盘 50 局', icon: '⭐' },
  { id: 'hundred_games', name: '大师', description: '累计复盘 100 局', icon: '🌟' },
  { id: 'blunder_hunter_10', name: '漏着猎人', description: '发现 10 个对手漏着', icon: '🔍' },
  { id: 'blunder_hunter_50', name: '高级猎人', description: '发现 50 个对手漏着', icon: '🎯' },
  { id: 'brilliant_5', name: '妙着大师', description: '做出 5 个妙着', icon: '✨' },
  { id: 'brilliant_20', name: '卓越棋手', description: '做出 20 个妙着', icon: '💫' },
  { id: 'win_10', name: '连胜达人', description: '累计赢得 10 局', icon: '🔥' },
  { id: 'win_50', name: '常胜将军', description: '累计赢得 50 局', icon: '💥' },
  { id: 'streak_7', name: '一周坚持', description: '连续 7 天复盘', icon: '📅' },
  { id: 'streak_30', name: '月坚持', description: '连续 30 天复盘', icon: '🗓️' },
  { id: 'rating_1500', name: '业余棋手', description: 'Rating 达到 1500', icon: '📈' },
  { id: 'rating_2000', name: '棋王', description: 'Rating 达到 2000', icon: '👑' },
];

// ============== 用户档案接口 ==============
export interface UserProfile {
  userId: string;
  username: string;
  xp: number;
  level: number;
  titles: Title[];
  achievements: Achievement[];
  streak: number; // 连续复盘天数
  lastReviewDate: string | null; // YYYY-MM-DD 格式
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    brilliants: number;
    blunders: number; // 对手漏着
    mistakes: number; // 自己的失误
  };
  radar: {
    opening: number;   // 开局 1-5
    middlegame: number; // 中盘 1-5
    endgame: number;   // 残局 1-5
    defense: number;   // 防守 1-5
    attack: number;    // 进攻 1-5
  };
}

/**
 * 创建默认用户档案
 */
export function createDefaultProfile(userId: string, username: string): UserProfile {
  return {
    userId,
    username,
    xp: 0,
    level: 1,
    titles: [],
    achievements: [],
    streak: 0,
    lastReviewDate: null,
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      brilliants: 0,
      blunders: 0,
      mistakes: 0,
    },
    radar: {
      opening: 1,
      middlegame: 1,
      endgame: 1,
      defense: 1,
      attack: 1,
    },
  };
}
