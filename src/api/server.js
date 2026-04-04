/**
 * Chess Coach API Server - 真实后端
 * 
 * 使用真实的 orchestrator 和各 Agent
 */

const express = require('express');
const { ChessOrchestrator } = require('./orchestrator');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize orchestrator
const orchestrator = new ChessOrchestrator();

// API endpoint
app.post('/api/chess-coach', async (req, res) => {
  try {
    const body = req.body;
    console.log('Request:', JSON.stringify(body, null, 2));
    
    const result = await orchestrator.handle(body);
    
    console.log('Response:', result.success ? '✅ success' : '❌ error');
    if (result.error) {
      console.log('Error:', result.error);
    }
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      requestId: `err_${Date.now()}`,
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║       🎯 Chess Coach API Server (Real Backend)       ║
╠═══════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                          ║
║  Endpoint: POST /api/chess-coach                       ║
╠═══════════════════════════════════════════════════════╣
║  Actions:                                             ║
║    • analyze      - 分析 PGN 棋谱                     ║
║    • crawl_user   - 抓取用户历史对局                   ║
║    • full_review  - 完整复盘（analyze + review）       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});
