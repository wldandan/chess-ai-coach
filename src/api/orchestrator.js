/**
 * Chess Orchestrator - 总管 Agent
 */

const { ChessCrawlerAgent } = require('../agents/crawler');
const { ChessEngineAgent } = require('../agents/engine');
const { ChessAnalystAgent } = require('../agents/analyst');
const { ChessReviewerAgent } = require('../agents/reviewer');
const { ChessGamificationAgent } = require('../agents/gamification');

// ============================================================
// Orchestrator
// ============================================================

class ChessOrchestrator {
  constructor() {
    this.crawler = new ChessCrawlerAgent();
    this.engine = new ChessEngineAgent();
    this.analyst = new ChessAnalystAgent();
    this.reviewer = new ChessReviewerAgent();
    this.gamification = new ChessGamificationAgent();
    this.requestId = '';
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async handle(request) {
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
            error: `Unknown action: ${request.action}`,
            requestId: this.requestId,
          };
      }
    } catch (error) {
      console.error(`[${this.requestId}] Error:`, error);
      return {
        success: false,
        error: error.message || 'Internal error',
        requestId: this.requestId,
      };
    }
  }

  // ============================================================
  // Action Handlers
  // ============================================================

  async handleAnalyze(request) {
    console.log(`[${this.requestId}] Running analyze...`);

    // 1. Engine analysis
    const analysisResult = await this.engine.analyze(request.pgn);
    console.log(`[${this.requestId}] Engine analysis done, accuracy:`, analysisResult.accuracy);

    // 2. Chess analyst deep review
    const analystResult = await this.analyst.review({
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

  async handleCrawlUser(request) {
    console.log(`[${this.requestId}] Running crawl_user for:`, request.username);

    const result = await this.crawler.crawlUser(request.username, request.limit || 10);
    console.log(`[${this.requestId}] Crawled ${result.games.length} games`);

    return {
      success: true,
      data: result,
      requestId: this.requestId,
    };
  }

  async handleFullReview(request) {
    console.log(`[${this.requestId}] Running full_review...`);

    // 1. Engine analysis
    console.log(`[${this.requestId}] Step 1: Engine analysis...`);
    const analysisResult = await this.engine.analyze(request.pgn);

    // 2. Chess analyst deep review
    console.log(`[${this.requestId}] Step 2: Analyst review...`);
    const analystResult = await this.analyst.review({
      pgn: request.pgn,
      accuracy: analysisResult.accuracy,
      blunders: analysisResult.blunders,
      brilliants: analysisResult.brilliants,
      opening: analysisResult.opening,
    });

    // 3. Get user profile
    console.log(`[${this.requestId}] Step 3: Get user profile...`);
    const userProfile = this.gamification.getMockProfile(request.userId);

    // 4. Generate review card
    console.log(`[${this.requestId}] Step 4: Generate review...`);
    const reviewResult = await this.reviewer.generate({
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
    const gamificationResult = this.gamification.update({
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

module.exports = { ChessOrchestrator };
