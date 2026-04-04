/**
 * Reviewer Agent - 生成趣味复盘卡片
 *
 * 输入 gameInfo + analysis + userProfile，输出游戏化 Markdown/HTML 复盘
 * 评语风格：俏皮、中二、14岁青少年口吻
 *
 * 依赖：
 *   - ../gamification (XP、称号、成就、雷达图)
 */

import {
  type UserProfile,
  type Title,
  type Achievement,
  calculateXP,
  type XPCalculationInput,
  checkNewTitles,
  checkNewAchievements,
  updateRadarData,
  calculateRadarData,
  RADAR_LABELS,
} from '../gamification';

// ============================================================
// Types
// ============================================================

export interface Blunder {
  move: number;
  san: string;       // e.g. "Bd3"
  comment: string;
  evalLoss: number;  // 评估损失（centipawn）
}

export interface Brilliant {
  move: number;
  san: string;
  comment: string;
  evalGain: number;  // 评估收益（centipawn）
}

export interface GameInfo {
  username: string;
  opponent: string;
  result: 'win' | 'lose' | 'draw';
  timeControl: string;
  date: string;
  rating?: number;
  opponentRating?: number;
}

export interface Analysis {
  accuracy: number;          // 0-100
  blunders: Blunder[];       // 自己的漏着
  brilliants: Brilliant[];   // 自己的妙着
  opening?: string;          // 开局名
  eco?: string;              // ECO 编码
  // 各阶段评分（0-1），由 analyzer 提供
  phaseScores?: {
    opening: number;
    middlegame: number;
    endgame: number;
    defense: number;
    attack: number;
  };
}

export interface ReviewInput {
  gameInfo: GameInfo;
  analysis: Analysis;
  userProfile: UserProfile;
}

export interface ReviewResult {
  /** Markdown 格式复盘卡片 */
  markdown: string;
  /** HTML 格式复盘卡片 */
  html: string;
  /** 本局获得 XP */
  xpGained: number;
  /** 新解锁称号 */
  newTitles: Title[];
  /** 新解锁成就 */
  newAchievements: Achievement[];
  /** 更新后的雷达图数据 */
  radarData: ReturnType<typeof calculateRadarData>;
  /** 更新后的用户档案（用于外部保存） */
  updatedProfile: UserProfile;
}

/** 外部 LLM 客户端接口 */
export interface LLMClient {
  generate(prompt: string): Promise<string>;
}

// ============================================================
// 雷达图星级渲染
// ============================================================

function radarStars(value: number): string {
  const full = Math.floor(value);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

// ============================================================
// LLM 趣味评语生成
// ============================================================

function buildLlmPrompt(input: ReviewInput): string {
  const { gameInfo, analysis, userProfile } = input;

  const blunderLines = analysis.blunders.slice(0, 2)
    .map(b => `第${b.move}步 ${b.san}：${b.comment}`)
    .join('\n');

  const brilliantLines = analysis.brilliants.slice(0, 2)
    .map(b => `第${b.move}步 ${b.san}：${b.comment}`)
    .join('\n');

  const radar = calculateRadarData(userProfile);
  const radarStr = radar.labels
    .map((label, i) => `${label} ${radarStars(radar.values[i])}`)
    .join(' | ');

  return `你是 ChessCoach，一个为14岁小朋友提供国际象棋趣味复盘的中二AI助手。

请用**俏皮、中二、14岁青少年**的口吻生成一段复盘评语：
- 热血少年漫解说风格
- 适当用 emoji
- 不说教，多鼓励
- 100-150字
- 直接输出评语文字，不要加 markdown 格式！

【本局信息】
- 我的结果：${gameInfo.result === 'win' ? '胜利' : gameInfo.result === 'lose' ? '失败' : '平局'}
- 对手：${gameInfo.opponent}${gameInfo.opponentRating ? ` (Rating ${gameInfo.opponentRating})` : ''}
- 我的准确率：${analysis.accuracy}%
- 时间控制：${gameInfo.timeControl}
- 开局：${analysis.opening ?? '未知开局'}

【我的漏着】${analysis.blunders.length > 0 ? blunderLines : '本局无漏着！'}
【我的妙着】${analysis.brilliants.length > 0 ? brilliantLines : '暂无妙着记录'}

【能力雷达】${radarStr}
【当前等级】Lv.${userProfile.level} (${userProfile.xp} XP)
`.trim();
}

// 无 LLM 时的默认评语
function defaultComment(result: GameInfo['result'], accuracy: number, blunder: Blunder | null, brilliant: Brilliant | null): string {
  if (result === 'win') {
    if (accuracy >= 90) return '这盘棋下得太帅了！简直是天选之人，对手都被你的王霸之气震慑到了！✨';
    if (accuracy >= 80) return '漂亮！虽然中间有点小波折，但最后还是完美收官！继续保持这个状态！🔥';
    return '赢就是赢！虽然有些地方还可以更好，但最重要的是——你赢了！下次继续冲！💪';
  }
  if (result === 'lose') {
    if (brilliant) return `虽然输了，但第${brilliant.move}步那个${brilliant.san}真是绝了！虽败犹荣！✨`;
    return '输一盘不算什么！每个大师都是从输棋开始的，重要的是学到东西，下次复仇！😤';
  }
  return '平局也是一种艺术！说明你和对手势均力敌，下次再战！🤝';
}

// ============================================================
// Markdown / HTML 构建
// ============================================================

function buildCardMarkdown(input: ReviewInput, result: ReviewResult, funnyComment: string): string {
  const { gameInfo, analysis, userProfile } = input;
  const { radarData, newTitles } = result;

  const resultEmoji = gameInfo.result === 'win' ? '🏆' : gameInfo.result === 'lose' ? '😢' : '🤝';
  const resultText = gameInfo.result === 'win' ? '胜利' : gameInfo.result === 'lose' ? '失败' : '平局';

  const worstBlunder = analysis.blunders[0] ?? null;
  const bestBrilliant = analysis.brilliants[0] ?? null;

  const radarLines = [];
  const half = Math.ceil(radarData.labels.length / 2);
  for (let i = 0; i < half; i++) {
    const j = i + half;
    const line = `   ${radarData.labels[i]} ${radarStars(radarData.values[i])}  ${radarData.labels[j]} ${radarStars(radarData.values[j])}`;
    radarLines.push(line);
  }

  let md = `${resultEmoji} 对局复盘：vs ${gameInfo.opponent} (${gameInfo.timeControl})\n\n`;
  md += `🏆 结果：${resultText}！${gameInfo.result === 'win' ? `(+${result.xpGained} XP)` : `(+${result.xpGained} XP)`}\n\n`;
  md += `⭐ 准确率：${analysis.accuracy}%\n`;

  if (worstBlunder) {
    md += `🔴 漏着：第${worstBlunder.move}步 - ${worstBlunder.san} ❌\n`;
    md += `   "${worstBlunder.comment}"\n`;
  }
  if (bestBrilliant) {
    md += `🟡 妙着：第${bestBrilliant.move}步 - ${bestBrilliant.san} ✨\n`;
    md += `   "${bestBrilliant.comment}"\n`;
  }

  md += `\n💬 ${funnyComment}\n\n`;
  md += `📊 能力雷达：\n`;
  md += radarLines.join('\n') + '\n';

  if (newTitles.length > 0) {
    md += `\n🏅 新称号解锁：${newTitles.map(t => `${t.icon} ${t.name}`).join('、')}\n`;
  }

  return md;
}

function markdownToHtml(md: string): string {
  return `<div class="review-card">${
    md.split('\n').map(line => {
      if (line.startsWith('🏆') || line.startsWith('⭐') || line.startsWith('🔴') ||
          line.startsWith('🟡') || line.startsWith('💬') || line.startsWith('📊') ||
          line.startsWith('🏅') || line.startsWith('⚔️') || line.startsWith('   [')) {
        return `<p class="review-line">${line}</p>`;
      }
      if (line.trim()) return `<span class="review-inline">${line}</span><br>`;
      return '<br>';
    }).join('')
  }</div>`;
}

// ============================================================
// 主函数
// ============================================================

/**
 * 生成趣味复盘卡片
 *
 * @param input  - gameInfo + analysis + userProfile
 * @param llm    - 可选外部 LLM 客户端（如 baoyu）
 * @returns ReviewResult
 */
export async function generateReview(input: ReviewInput, llm?: LLMClient): Promise<ReviewResult> {
  const { gameInfo, analysis, userProfile } = input;

  // ---- 1. XP 计算 ----
  const xpInput: XPCalculationInput = {
    isWin: gameInfo.result === 'win',
    accuracy: analysis.accuracy,
    brilliants: analysis.brilliants.length,
    opponentBlunders: analysis.blunders.filter(b => b.evalLoss >= 100).length,
    ownMistakes: analysis.blunders.length,
    streak: userProfile.streak,
  };
  const xpGained = calculateXP(xpInput);

  // ---- 2. 称号 & 成就检查（基于更新后 stats）----
  const updatedStats: UserProfile['stats'] = {
    ...userProfile.stats,
    totalGames: userProfile.stats.totalGames + 1,
    wins: userProfile.stats.wins + (gameInfo.result === 'win' ? 1 : 0),
    losses: userProfile.stats.losses + (gameInfo.result === 'lose' ? 1 : 0),
    draws: userProfile.stats.draws + (gameInfo.result === 'draw' ? 1 : 0),
    brilliants: userProfile.stats.brilliants + analysis.brilliants.length,
    blunders: userProfile.stats.blunders + analysis.blunders.length,
    mistakes: userProfile.stats.mistakes + analysis.blunders.length,
  };
  const newTitles = checkNewTitles(userProfile, updatedStats).map(u => u.title);
  const newAchievements = checkNewAchievements(userProfile, updatedStats).map(u => u.achievement);

  // ---- 3. 雷达图更新 ----
  const updatedRadar = analysis.phaseScores
    ? updateRadarData(userProfile, analysis.phaseScores)
    : userProfile.radar;
  const radarData = calculateRadarData({ ...userProfile, radar: updatedRadar });

  // ---- 4. 更新后的档案 ----
  const updatedProfile: UserProfile = {
    ...userProfile,
    xp: userProfile.xp + xpGained,
    level: Math.floor((userProfile.xp + xpGained) / 100) + 1,
    stats: updatedStats,
    radar: updatedRadar,
    lastReviewDate: new Date().toISOString().slice(0, 10),
    streak: userProfile.lastReviewDate === new Date().toISOString().slice(0, 10)
      ? userProfile.streak
      : userProfile.streak + 1,
  };

  // ---- 5. 趣味评语 ----
  const funnyComment = llm
    ? await llm.generate(buildLlmPrompt(input))
    : defaultComment(
        gameInfo.result,
        analysis.accuracy,
        analysis.blunders[0] ?? null,
        analysis.brilliants[0] ?? null
      );

  // ---- 6. 构建卡片 ----
  const reviewResult: ReviewResult = {
    markdown: '',
    html: '',
    xpGained,
    newTitles,
    newAchievements,
    radarData,
    updatedProfile,
  };

  reviewResult.markdown = buildCardMarkdown(input, reviewResult, funnyComment);
  reviewResult.html = markdownToHtml(reviewResult.markdown);

  return reviewResult;
}


