/**
 * Chess Coach API Mock Server
 *
 * 使用静态 JSON 数据提供模拟响应
 * 端口: 18789
 * 端点: http://localhost:18789/api/chess-coach
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 18889;

// Load mock data
const mockData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mock-data.json'), 'utf-8'));

/**
 * Generate mock analyze response
 */
function generateAnalyzeResponse(pgn, userId) {
  // Randomize slightly based on PGN length for variety
  const seed = (pgn?.length || 0) % 7;
  const accuracies = [78.5, 82.3, 85.1, 88.7, 91.2, 76.4, 89.3];
  const accuracy = accuracies[seed];
  const blunders = Math.floor(Math.random() * 4);
  const mistakes = Math.floor(Math.random() * 5);
  const brilliants = Math.floor(Math.random() * 3);

  return {
    accuracy,
    blunders,
    brilliants,
    mistakes,
    xp: Math.round(accuracy * 0.5) + brilliants * 15 - blunders * 10,
    title: accuracy >= 85 ? '战术高手' : accuracy >= 75 ? '战术新星' : '初出茅庐',
    gameId: `mock_${Date.now()}`,
    opening: mockData.analyze.opening,
    eco: mockData.analyze.eco,
    phaseScores: mockData.analyze.phaseScores,
  };
}

/**
 * Generate mock crawl_user response
 */
function generateCrawlUserResponse(username, limit = 10) {
  const games = [];
  const names = ['MagnusCarlsen', 'Hikaru', 'FabianoCaruana', 'DingLiren', 'IanNepomniachtchi'];
  const results = ['win', 'lose', 'draw'];
  const timeControls = ['15+10', '10+0', '30+0', '60+0'];

  for (let i = 0; i < Math.min(limit, 20); i++) {
    const rating = 1400 + Math.floor(Math.random() * 400);
    games.push({
      gameId: `game_${Date.now()}_${i}`,
      opponent: names[Math.floor(Math.random() * names.length)],
      result: results[Math.floor(Math.random() * results.length)],
      timeControl: timeControls[Math.floor(Math.random() * timeControls.length)],
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      rating,
      opponentRating: rating + Math.floor(Math.random() * 800) - 400,
      url: `https://www.chess.com/game/live/${Date.now() + i}`,
    });
  }

  return { games, username: username || 'demo_user' };
}

/**
 * Generate mock full_review response
 */
function generateFullReviewResponse(pgn, userId, username) {
  const analyze = generateAnalyzeResponse(pgn, userId);

  return {
    gameInfo: {
      opponent: 'MockOpponent',
      result: 'win',
      timeControl: '15+10',
      date: new Date().toISOString().split('T')[0],
      rating: 1500,
      opponentRating: 1600,
    },
    analysis: {
      accuracy: analyze.accuracy,
      blunders: mockData.full_review.analysis.blunders,
      brilliants: mockData.full_review.analysis.brilliants,
      opening: analyze.opening,
    },
    review: mockData.full_review.review,
    gamification: {
      xpGained: analyze.xp,
      newTitles: analyze.accuracy >= 85 ? [{ id: 'tactics_master', name: '战术高手', icon: '🔥' }] : [],
      newAchievements: [],
      radarData: {
        labels: ['开局', '中盘', '残局', '防守', '进攻'],
        values: [3 + Math.floor(Math.random() * 2), 3 + Math.floor(Math.random() * 2), 2 + Math.floor(Math.random() * 3), 2 + Math.floor(Math.random() * 2), 3 + Math.floor(Math.random() * 2)],
      },
    },
    chessAnalyst: mockData.full_review.chessAnalyst,
  };
}

/**
 * Handle API request
 */
function handleApiRequest(body) {
  const { action, pgn, userId, username, limit } = body;

  console.log(`[Mock Server] Action: ${action}`);

  switch (action) {
    case 'analyze':
      return { success: true, data: generateAnalyzeResponse(pgn, userId) };

    case 'crawl_user':
      return { success: true, data: generateCrawlUserResponse(username, limit) };

    case 'full_review':
      return { success: true, data: generateFullReviewResponse(pgn, userId, username) };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  console.log(`[${reqId}] ${req.method} ${req.url}`);
  console.log(`[${reqId}] Headers:`, JSON.stringify(req.headers));

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // API endpoint
  if (req.method === 'POST' && req.url === '/api/chess-coach') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        console.log(`[${reqId}] Request:`, JSON.stringify(request, null, 2).slice(0, 200));

        const result = handleApiRequest(request);

        console.log(`[${reqId}] Response:`, result.success ? '✅ success' : '❌ error');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error(`[${reqId}] Error:`, error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
          requestId: reqId,
        }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║       🎯 Chess Coach API Mock Server                 ║
╠══════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                        ║
║  Endpoint: POST /api/chess-coach                     ║
╠══════════════════════════════════════════════════════╣
║  Actions:                                            ║
║    • analyze      - 分析 PGN 棋谱                    ║
║    • crawl_user   - 抓取用户历史对局                  ║
║    • full_review  - 完整复盘（analyze + review）     ║
╚══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  server.close();
  process.exit(0);
});
