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
// Mock Data (loaded from JSON)
// ============================================================

import mockData from './mock-data.json';

// ============================================================
// Mock API Handler
// ============================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateMockAnalyzeResult(): AnalyzeResult {
  return {
    ...mockData.analyze,
    gameId: `game_${Date.now()}`,
  };
}

function generateMockCrawlResult(username: string): CrawlUserResult {
  return {
    username,
    games: mockData.crawl_user.games,
  };
}

function generateMockFullReview(pgn: string, username: string): FullReviewResult {
  return {
    gameId: `game_${Date.now()}`,
    gameInfo: {
      ...mockData.full_review.gameInfo,
      date: new Date().toISOString().split('T')[0],
    },
    analysis: mockData.full_review.analysis,
    review: mockData.full_review.review,
    gamification: mockData.full_review.gamification,
    chessAnalyst: mockData.full_review.chessAnalyst,
  };
}

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
