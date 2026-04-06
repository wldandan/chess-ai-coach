/**
 * 雷达图数据计算
 * 5 维度：开局/中盘/残局/防守/进攻
 */
import { UserProfile } from './profile';

export interface RadarData {
  labels: string[];
  values: number[]; // 1-5 范围
  maxValue: number;
}

// ============== 雷达图维度定义 ==============
export const RADAR_LABELS = ['开局', '中盘', '残局', '防守', '进攻'] as const;
export const RADAR_MAX = 5;

/**
 * 计算雷达图数据
 * @param profile 用户档案
 * @returns 雷达图数据 {labels, values: [1-5], maxValue}
 */
export function calculateRadarData(profile: UserProfile): RadarData {
  return {
    labels: [...RADAR_LABELS],
    values: [
      clamp(profile.radar.opening, 1, 5),
      clamp(profile.radar.middlegame, 1, 5),
      clamp(profile.radar.endgame, 1, 5),
      clamp(profile.radar.defense, 1, 5),
      clamp(profile.radar.attack, 1, 5),
    ],
    maxValue: RADAR_MAX,
  };
}

/**
 * 更新雷达图数据（基于单局分析）
 * @param profile 当前档案
 * @param phaseScores 各阶段评分 {opening, middlegame, endgame, defense, attack} 均为 0-1
 */
export interface PhaseScores {
  opening: number;   // 0-1
  middlegame: number; // 0-1
  endgame: number;   // 0-1
  defense: number;   // 0-1
  attack: number;    // 0-1
}

export function updateRadarData(profile: UserProfile, scores: PhaseScores): UserProfile['radar'] {
  const { radar } = profile;
  const weight = 0.2; // 新对局权重 20%

  // 将 0-1 分数转换为 1-5 分数
  const toRadarScore = (score: number) => Math.round(1 + score * 4);

  return {
    opening: weightedAverage(radar.opening, toRadarScore(scores.opening), weight),
    middlegame: weightedAverage(radar.middlegame, toRadarScore(scores.middlegame), weight),
    endgame: weightedAverage(radar.endgame, toRadarScore(scores.endgame), weight),
    defense: weightedAverage(radar.defense, toRadarScore(scores.defense), weight),
    attack: weightedAverage(radar.attack, toRadarScore(scores.attack), weight),
  };
}

// ============== 辅助函数 ==============
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function weightedAverage(oldScore: number, newScore: number, weight: number): number {
  // 旧分数占 (1-weight)，新分数占 weight
  const avg = oldScore * (1 - weight) + newScore * weight;
  return Math.round(avg * 10) / 10; // 保留一位小数
}

/**
 * 获取雷达图数据（用于渲染）
 * 返回适合图表库格式的数据
 */
export function getRadarChartData(profile: UserProfile) {
  const data = calculateRadarData(profile);
  return {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
      },
    ],
  };
}

/**
 * 获取最强和最弱的维度
 */
export function getRadarInsights(profile: UserProfile): { strongest: string; weakest: string } {
  const { radar } = profile;
  const entries = Object.entries(radar) as [string, number][];
  
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const labelMap: Record<string, string> = {
    opening: '开局',
    middlegame: '中盘',
    endgame: '残局',
    defense: '防守',
    attack: '进攻',
  };

  return {
    strongest: labelMap[sorted[0][0]] ?? sorted[0][0],
    weakest: labelMap[sorted[sorted.length - 1][0]] ?? sorted[sorted.length - 1][0],
  };
}
