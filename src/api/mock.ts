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
// Mock Data Files
// ============================================================

import defaultData from './mock-data.json';
import noRatingData from './mock-data-no-rating.json';
import drawData from './mock-data-draw.json';
import noXpData from './mock-data-no-xp.json';
import errorData from './mock-data-error.json';
import longGameData from './mock-data-long-game.json';

const mockDataSets: Record<string, any> = {
  default: defaultData,
  'no-rating': noRatingData,
  draw: drawData,
  'no-xp': noXpData,
  error: errorData,
  'long-game': longGameData,
};

function getMockData(mockName?: string): any {
  if (!mockName || !mockDataSets[mockName]) {
    return defaultData;
  }
  return mockDataSets[mockName];
}

// ============================================================
// Mock API Handler
// ============================================================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateMockAnalyzeResult(mockName?: string): AnalyzeResult {
  const data = getMockData(mockName);
  return {
    ...data.analyze,
    gameId: `game_${Date.now()}`,
  };
}

function generateMockCrawlResult(username: string, mockName?: string): CrawlUserResult {
  const data = getMockData(mockName);
  return {
    username,
    games: data.crawl_user.games,
  };
}

function generateMockFullReview(pgn: string, username: string, mockName?: string): FullReviewResult {
  const data = getMockData(mockName);
  return {
    gameId: `game_${Date.now()}`,
    gameInfo: {
      ...data.full_review.gameInfo,
      date: new Date().toISOString().split('T')[0],
    },
    analysis: data.full_review.analysis,
    review: data.full_review.review,
    gamification: data.full_review.gamification,
    chessAnalyst: data.full_review.chessAnalyst,
  };
}

export async function handleApiRequest(
  body: AnalyzeRequest | CrawlUserRequest | FullReviewRequest
): Promise<ApiResponse<unknown>> {
  const requestId = generateRequestId();
  const mockName = (body as any).mock;

  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    switch (body.action) {
      case 'analyze':
        return {
          success: true,
          data: generateMockAnalyzeResult(mockName),
          requestId,
        };

      case 'crawl_user':
        return {
          success: true,
          data: generateMockCrawlResult((body as CrawlUserRequest).username, mockName),
          requestId,
        };

      case 'full_review':
        const req = body as FullReviewRequest;
        return {
          success: true,
          data: generateMockFullReview(req.pgn, req.username, mockName),
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

  // 测试所有 mock 数据集
  const mockSets = ['default', 'no-rating', 'draw', 'no-xp', 'error', 'long-game'];

  for (const mockName of mockSets) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Testing mock dataset: ${mockName}`);
    console.log('='.repeat(50));

    const result = await handleApiRequest({
      action: 'full_review',
      pgn: '1.e4 e5 2.Nf3 Nc6',
      userId: 'test_user',
      username: 'TestPlayer',
      mock: mockName,
    });

    const data = result.data as any;
    console.log(`  gameId: ${data?.gameId}`);
    console.log(`  result: ${data?.gameInfo?.result}`);
    console.log(`  accuracy: ${data?.analysis?.accuracy}`);
    console.log(`  xpGained: ${data?.gamification?.xpGained}`);
    console.log(`  achievements: ${data?.gamification?.newAchievements?.length}`);
  }
}

// test();

export default handleApiRequest;
