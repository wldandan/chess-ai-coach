/**
 * Chess Coach API Mock (CommonJS)
 */

const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const generateMockAnalyzeResult = () => ({
  gameId: `game_${Date.now()}`,
  accuracy: 82.5,
  blunders: [
    {
      move: 24,
      san: 'Bd3',
      comment: '象被抽了，对手笑开花',
      evalLoss: 1.2,
      bestMove: 'Nf3',
    },
  ],
  brilliants: [
    {
      move: 31,
      san: 'Qc6',
      comment: '皇后偷杀！对手直接懵了',
      evalGain: 2.5,
    },
  ],
  opening: 'Sicilian Defense',
  eco: 'B21',
  phaseScores: {
    opening: 0.75,
    middlegame: 0.65,
    endgame: 0.80,
    defense: 0.60,
    attack: 0.85,
  },
  pgn: '',
});

const generateMockCrawlResult = (username) => ({
  username,
  games: [
    {
      gameId: 'game_001',
      opponent: 'MagnusCarlsen',
      result: 'win',
      timeControl: '15+10',
      date: '2026-04-03',
      rating: 1523,
      opponentRating: 2850,
      url: 'https://www.chess.com/game/live/123456789',
    },
    {
      gameId: 'game_002',
      opponent: 'Hikaru',
      result: 'lose',
      timeControl: '15+10',
      date: '2026-04-02',
      rating: 1515,
      opponentRating: 3200,
      url: 'https://www.chess.com/game/live/123456788',
    },
  ],
});

const generateMockFullReview = (pgn, username) => ({
  gameId: `game_${Date.now()}`,
  gameInfo: {
    opponent: 'MagnusCarlsen',
    result: 'win',
    timeControl: '15+10',
    date: new Date().toISOString().split('T')[0],
    rating: 1523,
    opponentRating: 2850,
  },
  analysis: {
    accuracy: 82.5,
    blunders: [
      {
        move: 24,
        san: 'Bd3',
        comment: '象被抽了，对手笑开花',
        evalLoss: 1.2,
        bestMove: 'Nf3',
      },
    ],
    brilliants: [
      {
        move: 31,
        san: 'Qc6',
        comment: '皇后偷杀！对手直接懵了',
        evalGain: 2.5,
      },
    ],
    opening: 'Sicilian Defense',
  },
  review: {
    markdown: `🏆 对局复盘：vs MagnusCarlsen (15+10)

🏆 结果：胜利！(+8 XP)

⭐ 准确率：82.5%
🔴 漏着：第24步 - Bd3 ❌
🟡 妙着：第31步 - Qc6 ✨

💬 进攻很凶，但防守有点浪 😂

📊 能力雷达：
   开局 ★★★★☆  中盘 ★★★☆☆
   残局 ★★★☆☆  防守 ★★☆☆☆
   进攻 ★★★★★`,
    html: '<div class="review-card">...</div>',
  },
  gamification: {
    xpGained: 8,
    newTitles: [{ id: 'first_review', name: '初出茅庐', icon: '🏅' }],
    newAchievements: [],
    radarData: {
      labels: ['开局', '中盘', '残局', '防守', '进攻'],
      values: [4, 3, 3, 2, 5],
    },
  },
  chessAnalyst: {
    summary: '这盘棋共 42 步，胜利。白方进攻凶猛，但中盘防守有待提高。',
    keyMistakes: [
      {
        move: 24,
        description: '象 d3 被抽',
        originalMove: 'Bd3',
        suggestedMove: 'Nf3',
        reason: '象在 d3 被黑方马跳吃，没有保护。建议走 Nf3 保护象并威胁反击。',
      },
    ],
    bestMoves: [
      {
        move: 31,
        san: 'Qc6',
        reason: '皇后走到 c6 形成强烈威胁，对手无法防守，是决定性的妙着！',
      },
    ],
    openingInsight: 'Sicilian Defense 是对抗 e4 的经典选择，白方选择开放变例进攻性很强。',
    todayLesson: '进攻时注意保护自己的子力，不要过度扩张导致子力损失。',
  },
});

async function handleApiRequest(body) {
  const requestId = generateRequestId();
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    switch (body.action) {
      case 'analyze':
        return { success: true, data: generateMockAnalyzeResult(), requestId };
      case 'crawl_user':
        return { success: true, data: generateMockCrawlResult(body.username), requestId };
      case 'full_review':
        return { success: true, data: generateMockFullReview(body.pgn, body.username), requestId };
      default:
        return { success: false, error: `Unknown action: ${body.action}`, requestId };
    }
  } catch (error) {
    return { success: false, error: error.message || 'Internal error', requestId };
  }
}

module.exports = { handleApiRequest };
