/**
 * Chess Coach API Mock
 * 
 * 对外提供的 HTTP API 接口定义
 * Base URL: http://localhost:18789/api/chess-coach
 */

// ============================================================
// Types
// ============================================================

export type Action = 'analyze' | 'crawl_user' | 'full_review';

// ---- 通用响应格式 ----
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
}

// ---- analyze ----
export interface AnalyzeRequest {
  action: 'analyze';
  pgn: string;
  userId?: string;
}

export interface AnalyzeResult {
  gameId: string;
  accuracy: number;
  blunders: Blunder[];
  brilliants: Brilliant[];
  opening: string;
  eco: string;
  phaseScores: PhaseScores;
  pgn: string;
}

export interface Blunder {
  move: number;
  san: string;
  comment: string;
  evalLoss: number;
  bestMove: string;
}

export interface Brilliant {
  move: number;
  san: string;
  comment: string;
  evalGain: number;
}

export interface PhaseScores {
  opening: number;
  middlegame: number;
  endgame: number;
  defense: number;
  attack: number;
}

// ---- crawl_user ----
export interface CrawlUserRequest {
  action: 'crawl_user';
  username: string;
  limit?: number;
}

export interface CrawlUserResult {
  username: string;
  games: GameSummary[];
}

export interface GameSummary {
  gameId: string;
  opponent: string;
  result: 'win' | 'lose' | 'draw';
  timeControl: string;
  date: string;
  rating?: number;
  opponentRating?: number;
  url: string;
}

// ---- full_review ----
export interface FullReviewRequest {
  action: 'full_review';
  pgn: string;
  userId: string;
  username: string;
}

export interface FullReviewResult {
  gameId: string;
  gameInfo: {
    opponent: string;
    result: 'win' | 'lose' | 'draw';
    timeControl: string;
    date: string;
    rating?: number;
    opponentRating?: number;
  };
  analysis: {
    accuracy: number;
    blunders: Blunder[];
    brilliants: Brilliant[];
    opening: string;
  };
  review: {
    markdown: string;
    html: string;
  };
  gamification: {
    xpGained: number;
    newTitles: Title[];
    newAchievements: Achievement[];
    radarData: RadarData;
  };
  chessAnalyst: {
    summary: string;
    keyMistakes: KeyMistake[];
    bestMoves: BestMove[];
    openingInsight: string;
    todayLesson: string;
  };
}

export interface Title {
  id: string;
  name: string;
  icon: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface RadarData {
  labels: string[];
  values: number[];
}

export interface KeyMistake {
  move: number;
  description: string;
  originalMove: string;
  suggestedMove: string;
  reason: string;
}

export interface BestMove {
  move: number;
  san: string;
  reason: string;
}

// ============================================================
// Mock 响应生成器
// ============================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateMockAnalyzeResult(): AnalyzeResult {
  return {
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
  };
}

function generateMockCrawlResult(username: string): CrawlUserResult {
  return {
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
  };
}

function generateMockFullReview(pgn: string, username: string): FullReviewResult {
  return {
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
      newTitles: [
        { id: 'first_review', name: '初出茅庐', icon: '🏅' },
      ],
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
  };
}

// ============================================================
// Mock API Handler
// ============================================================

export async function handleApiRequest(
  body: AnalyzeRequest | CrawlUserRequest | FullReviewRequest
): Promise<ApiResponse<unknown>> {
  const requestId = generateRequestId();

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    switch (body.action) {
      case 'analyze':
        return {
          success: true,
          data: generateMockAnalyzeResult(),
          requestId,
        };

      case 'crawl_user':
        return {
          success: true,
          data: generateMockCrawlResult((body as CrawlUserRequest).username),
          requestId,
        };

      case 'full_review':
        const req = body as FullReviewRequest;
        return {
          success: true,
          data: generateMockFullReview(req.pgn, req.username),
          requestId,
        };

      default:
        return {
          success: false,
          error: `Unknown action: ${(body as any).action}`,
          requestId,
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal error',
      requestId,
    };
  }
}

// ============================================================
// 测试
// ============================================================

async function test() {
  console.log('🧪 Testing Chess Coach API Mock\n');

  // Test analyze
  console.log('1. POST /api/chess-coach { action: "analyze" }');
  const analyzeResult = await handleApiRequest({
    action: 'analyze',
    pgn: '1.e4 e5 2.Nf3 Nc6',
    userId: 'test_user',
  });
  console.log(JSON.stringify(analyzeResult, null, 2));

  // Test crawl_user
  console.log('\n2. POST /api/chess-coach { action: "crawl_user" }');
  const crawlResult = await handleApiRequest({
    action: 'crawl_user',
    username: 'MagnusFan2024',
    limit: 10,
  });
  console.log(JSON.stringify(crawlResult, null, 2));

  // Test full_review
  console.log('\n3. POST /api/chess-coach { action: "full_review" }');
  const fullResult = await handleApiRequest({
    action: 'full_review',
    pgn: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6',
    userId: 'test_user',
    username: 'ChessKid',
  });
  console.log(JSON.stringify(fullResult, null, 2));
}

// test();

export default handleApiRequest;
