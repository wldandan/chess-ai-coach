/**
 * Chess Orchestrator - 总管 Agent
 * 
 * 接收 HTTP 请求，调度内部 Agent，聚合返回结果
 */

import { ChessCrawlerAgent } from '../agents/chess-crawler';
import { ChessEngineAgent } from '../agents/chess-engine';
import { ChessAnalystAgent } from '../agents/chess-analyst';
import { ChessReviewerAgent } from '../agents/chess-reviewer';
import { ChessGamificationAgent } from '../agents/chess-gamification';

// ============================================================
// Types
// ============================================================

export interface AnalyzeRequest {
  action: 'analyze';
  pgn: string;
  userId?: string;
}

export interface CrawlUserRequest {
  action: 'crawl_user';
  username: string;
  limit?: number;
}

export interface FullReviewRequest {
  action: 'full_review';
  pgn: string;
  userId: string;
  username: string;
}

export type ChessCoachRequest = AnalyzeRequest | CrawlUserRequest | FullReviewRequest;

export interface ChessCoachResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  requestId: string;
}

// ============================================================
// Agent Instances
// ============================================================

const crawler = new ChessCrawlerAgent();
const engine = new ChessEngineAgent();
const analyst = new ChessAnalystAgent();
const reviewer = new ChessReviewerAgent();
const gamification = new ChessGamificationAgent();

// ============================================================
// Orchestrator
// ============================================================

export class ChessOrchestrator {
  private requestId: string;

  constructor() {
    this.requestId = '';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async handle(request: ChessCoachRequest): Promise<ChessCoachResponse> {
    this.requestId = this.generateRequestId();
    console.log(`[${this.requestId}] Handling request:`, request.action);

    try {
      switch (request.action) {
        case 'analyze':
          return await this.handleAnalyze(request);
        case 'crawl_user':
          return await this.handleCrawlUser(request);
        case 'full_review':
          return await this.handleFullReview(request);
        default:
          return {
            success: false,
            error: `Unknown action: ${(request as any).action}`,
            requestId: this.requestId,
          };
      }
    } catch (error) {
      console.error(`[${this.requestId}] Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error',
        requestId: this.requestId,
      };
    }
  }

  // ============================================================
  // Action Handlers
  // ============================================================

  private async handleAnalyze(request: AnalyzeRequest): Promise<ChessCoachResponse> {
    console.log(`[${this.requestId}] Running analyze...`);

    // 1. Engine analysis
    const analysisResult = await engine.analyze(request.pgn);
    console.log(`[${this.requestId}] Engine analysis done, accuracy:`, analysisResult.accuracy);

    // 2. Chess analyst deep review
    const analystResult = await analyst.review({
      pgn: request.pgn,
      accuracy: analysisResult.accuracy,
      blunders: analysisResult.blunders,
      brilliants: analysisResult.brilliants,
      opening: analysisResult.opening,
    });
    console.log(`[${this.requestId}] Analyst review done`);

    return {
      success: true,
      data: {
        gameId: `game_${Date.now()}`,
        ...analysisResult,
        chessAnalyst: analystResult,
      },
      requestId: this.requestId,
    };
  }

  private async handleCrawlUser(request: CrawlUserRequest): Promise<ChessCoachResponse> {
    console.log(`[${this.requestId}] Running crawl_user for:`, request.username);

    const result = await crawler.crawlUser(request.username, request.limit || 10);
    console.log(`[${this.requestId}] Crawled ${result.games.length} games`);

    return {
      success: true,
      data: result,
      requestId: this.requestId,
    };
  }

  private async handleFullReview(request: FullReviewRequest): Promise<ChessCoachResponse> {
    console.log(`[${this.requestId}] Running full_review...`);

    // 1. Engine analysis
    console.log(`[${this.requestId}] Step 1: Engine analysis...`);
    const analysisResult = await engine.analyze(request.pgn);

    // 2. Chess analyst deep review
    console.log(`[${this.requestId}] Step 2: Analyst review...`);
    const analystResult = await analyst.review({
      pgn: request.pgn,
      accuracy: analysisResult.accuracy,
      blunders: analysisResult.blunders,
      brilliants: analysisResult.brilliants,
      opening: analysisResult.opening,
    });

    // 3. Get user profile (mock for now)
    console.log(`[${this.requestId}] Step 3: Get user profile...`);
    const userProfile = gamification.getMockProfile(request.userId);

    // 4. Generate review card
    console.log(`[${this.requestId}] Step 4: Generate review...`);
    const reviewResult = await reviewer.generate({
      gameInfo: {
        username: request.username,
        opponent: analysisResult.opponent || 'Unknown',
        result: analysisResult.result || 'unknown',
        timeControl: analysisResult.timeControl || 'unknown',
        date: new Date().toISOString().split('T')[0],
      },
      analysis: {
        accuracy: analysisResult.accuracy,
        blunders: analysisResult.blunders.map(b => ({
          move: b.move,
          san: b.san,
          comment: b.comment,
          evalLoss: b.evalLoss,
        })),
        brilliants: analysisResult.brilliants.map(b => ({
          move: b.move,
          san: b.san,
          comment: b.comment,
          evalGain: b.evalGain,
        })),
        opening: analysisResult.opening,
      },
      userProfile,
    });

    // 5. Update gamification
    console.log(`[${this.requestId}] Step 5: Update gamification...`);
    const gamificationResult = gamification.update({
      userId: request.userId,
      isWin: analysisResult.result === 'win',
      accuracy: analysisResult.accuracy,
      brilliantsCount: analysisResult.brilliants.length,
      blundersCount: analysisResult.blunders.length,
    });

    console.log(`[${this.requestId}] Full review complete!`);

    return {
      success: true,
      data: {
        gameId: `game_${Date.now()}`,
        gameInfo: {
          opponent: analysisResult.opponent || 'Unknown',
          result: analysisResult.result || 'unknown',
          timeControl: analysisResult.timeControl || 'unknown',
          date: new Date().toISOString().split('T')[0],
          rating: userProfile.xp,
          opponentRating: 1500,
        },
        analysis: {
          accuracy: analysisResult.accuracy,
          blunders: analysisResult.blunders.map(b => ({
            move: b.move,
            san: b.san,
            comment: b.comment,
            evalLoss: b.evalLoss,
            bestMove: b.bestMove,
          })),
          brilliants: analysisResult.brilliants.map(b => ({
            move: b.move,
            san: b.san,
            comment: b.comment,
            evalGain: b.evalGain,
          })),
          opening: analysisResult.opening,
        },
        review: {
          markdown: reviewResult.markdown,
          html: reviewResult.html,
        },
        gamification: gamificationResult,
        chessAnalyst: analystResult,
      },
      requestId: this.requestId,
    };
  }
}

// Export singleton
export const chessOrchestrator = new ChessOrchestrator();
