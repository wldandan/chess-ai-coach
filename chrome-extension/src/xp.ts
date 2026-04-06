/**
 * XP 计算与等级/称号检查
 */
import { UserProfile, TITLES, ACHIEVEMENTS, xpToLevel, getLevelName, Title, Achievement } from './profile';

// ============== XP 计算规则 ==============
export interface XPCalculationInput {
  isWin: boolean;
  accuracy: number; // 0-100
  brilliants: number;  // 妙着数
  opponentBlunders: number; // 对手漏着数
  ownMistakes: number; // 自己的失误数
  streak: number; // 当前连续复盘天数
}

/**
 * 计算单次复盘的 XP 奖励
 */
export function calculateXP(input: XPCalculationInput): number {
  let xp = 10; // 基础 XP

  if (input.isWin) xp += 5; // 胜利加成

  if (input.accuracy > 80) xp += 3; // 准确率加成

  xp += input.brilliants * 2; // 每妙着 +2

  if (input.opponentBlunders >= 2) xp += 2; // 每漏着 < 2 的漏着加成（简化：对手>=2个漏着时+2）

  // 连续复盘加成：最高 +7
  const streakBonus = Math.min(input.streak, 7);
  xp += streakBonus;

  return xp;
}

// ============== Level Up 检查 ==============
export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  newTitle?: string;
}

/**
 * 检查是否升级
 */
export function checkLevelUp(oldXP: number, newXP: number): LevelUpResult {
  const oldLevel = xpToLevel(oldXP);
  const newLevel = xpToLevel(newXP);

  const result: LevelUpResult = {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
  };

  if (result.leveledUp) {
    result.newTitle = getLevelName(newLevel);
  }

  return result;
}

// ============== 新称号检查 ==============
export interface TitleUnlock {
  title: Title;
  reason: string;
}

/**
 * 检查并返回新解锁的称号
 */
export function checkNewTitles(profile: UserProfile, newStats: Partial<UserProfile['stats']>): TitleUnlock[] {
  const unlocked: TitleUnlock[] = [];
  const currentTitleIds = new Set(profile.titles.map(t => t.id));

  // 初出茅庐：完成第 1 次复盘
  if (!currentTitleIds.has('first_review') && (newStats.totalGames ?? profile.stats.totalGames) >= 1) {
    const title = TITLES.find(t => t.id === 'first_review')!;
    unlocked.push({ title, reason: '完成第一次复盘' });
  }

  // 漏着猎人：累计发现 10 个对手漏着
  if (!currentTitleIds.has('blunder_hunter') && (newStats.blunders ?? profile.stats.blunders) >= 10) {
    const title = TITLES.find(t => t.id === 'blunder_hunter')!;
    unlocked.push({ title, reason: '累计发现 10 个对手漏着' });
  }

  // 妙着大师：累计做出 5 个妙着
  if (!currentTitleIds.has('brilliant_master') && (newStats.brilliants ?? profile.stats.brilliants) >= 5) {
    const title = TITLES.find(t => t.id === 'brilliant_master')!;
    unlocked.push({ title, reason: '累计做出 5 个妙着' });
  }

  // 连胜达人：累计赢得 10 局
  if (!currentTitleIds.has('win_streak') && (newStats.wins ?? profile.stats.wins) >= 10) {
    const title = TITLES.find(t => t.id === 'win_streak')!;
    unlocked.push({ title, reason: '累计赢得 10 局' });
  }

  return unlocked;
}

// ============== 新成就检查 ==============
export interface AchievementUnlock {
  achievement: Achievement;
  reason: string;
}

/**
 * 检查并返回新解锁的成就
 */
export function checkNewAchievements(profile: UserProfile, newStats: Partial<UserProfile['stats']>): AchievementUnlock[] {
  const unlocked: AchievementUnlock[] = [];
  const currentAchievementIds = new Set(profile.achievements.map(a => a.id));
  const stats = { ...profile.stats, ...newStats };

  const achievementChecks: Array<{ id: string; condition: boolean; achievement: Achievement; reason: string }> = [
    { id: 'first_review', condition: stats.totalGames >= 1, achievement: ACHIEVEMENTS.find(a => a.id === 'first_review')!, reason: '完成第一次复盘' },
    { id: 'first_win', condition: stats.wins >= 1, achievement: ACHIEVEMENTS.find(a => a.id === 'first_win')!, reason: '赢得第一局' },
    { id: 'ten_games', condition: stats.totalGames >= 10, achievement: ACHIEVEMENTS.find(a => a.id === 'ten_games')!, reason: '累计复盘 10 局' },
    { id: 'fifty_games', condition: stats.totalGames >= 50, achievement: ACHIEVEMENTS.find(a => a.id === 'fifty_games')!, reason: '累计复盘 50 局' },
    { id: 'hundred_games', condition: stats.totalGames >= 100, achievement: ACHIEVEMENTS.find(a => a.id === 'hundred_games')!, reason: '累计复盘 100 局' },
    { id: 'blunder_hunter_10', condition: stats.blunders >= 10, achievement: ACHIEVEMENTS.find(a => a.id === 'blunder_hunter_10')!, reason: '发现 10 个对手漏着' },
    { id: 'blunder_hunter_50', condition: stats.blunders >= 50, achievement: ACHIEVEMENTS.find(a => a.id === 'blunder_hunter_50')!, reason: '发现 50 个对手漏着' },
    { id: 'brilliant_5', condition: stats.brilliants >= 5, achievement: ACHIEVEMENTS.find(a => a.id === 'brilliant_5')!, reason: '做出 5 个妙着' },
    { id: 'brilliant_20', condition: stats.brilliants >= 20, achievement: ACHIEVEMENTS.find(a => a.id === 'brilliant_20')!, reason: '做出 20 个妙着' },
    { id: 'win_10', condition: stats.wins >= 10, achievement: ACHIEVEMENTS.find(a => a.id === 'win_10')!, reason: '累计赢得 10 局' },
    { id: 'win_50', condition: stats.wins >= 50, achievement: ACHIEVEMENTS.find(a => a.id === 'win_50')!, reason: '累计赢得 50 局' },
    { id: 'streak_7', condition: profile.streak >= 7, achievement: ACHIEVEMENTS.find(a => a.id === 'streak_7')!, reason: '连续 7 天复盘' },
    { id: 'streak_30', condition: profile.streak >= 30, achievement: ACHIEVEMENTS.find(a => a.id === 'streak_30')!, reason: '连续 30 天复盘' },
  ];

  for (const check of achievementChecks) {
    if (!currentAchievementIds.has(check.id) && check.condition) {
      unlocked.push({ achievement: check.achievement, reason: check.reason });
    }
  }

  return unlocked;
}

/**
 * 添加 XP 并检查升级/新称号/新成就
 */
export interface AddXPResult {
  xpGained: number;
  newXP: number;
  levelUp: LevelUpResult;
  newTitles: TitleUnlock[];
  newAchievements: AchievementUnlock[];
}

export function addXP(profile: UserProfile, xpInput: XPCalculationInput): AddXPResult {
  const xpGained = calculateXP(xpInput);
  const newXP = profile.xp + xpGained;
  const levelUp = checkLevelUp(profile.xp, newXP);

  // 更新临时 stats
  const newStats: Partial<UserProfile['stats']> = {
    totalGames: profile.stats.totalGames + 1,
    wins: profile.stats.wins + (xpInput.isWin ? 1 : 0),
    losses: profile.stats.losses + (!xpInput.isWin && xpInput.ownMistakes > xpInput.opponentBlunders ? 1 : 0),
    draws: profile.stats.draws + (!xpInput.isWin && xpInput.ownMistakes === xpInput.opponentBlunders ? 1 : 0),
    brilliants: profile.stats.brilliants + xpInput.brilliants,
    blunders: profile.stats.blunders + xpInput.opponentBlunders,
    mistakes: profile.stats.mistakes + xpInput.ownMistakes,
  };

  const newTitles = checkNewTitles(profile, newStats);
  const newAchievements = checkNewAchievements(profile, newStats);

  return {
    xpGained,
    newXP,
    levelUp,
    newTitles,
    newAchievements,
  };
}
