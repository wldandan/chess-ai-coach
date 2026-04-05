/**
 * Chess Coach API Mock (CommonJS)
 */

const mockData = require('./mock-data.json');

const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function generateMockAnalyzeResult() {
  return {
    ...mockData.analyze,
    gameId: `game_${Date.now()}`,
  };
}

function generateMockCrawlResult(username) {
  return {
    username,
    games: mockData.crawl_user.games,
  };
}

function generateMockFullReview(pgn, username) {
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
