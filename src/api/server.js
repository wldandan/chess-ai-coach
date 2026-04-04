/**
 * Chess Coach Mock API Server
 */

const express = require('express');
const { handleApiRequest } = require('./mock');

const app = express();
const PORT = 3000;

app.use(express.json());

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

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.post('/api/chess-coach', async (req, res) => {
  try {
    const body = req.body;
    console.log('Request:', JSON.stringify(body, null, 2));
    const result = await handleApiRequest(body);
    console.log('Response:', result.success ? '✅ success' : '❌ error');
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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║       🎯 Chess Coach API Mock Server                  ║
╠═══════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                          ║
║  Endpoint: POST /api/chess-coach                       ║
╠═══════════════════════════════════════════════════════╣
║  Actions:                                             ║
║    • analyze      - 分析 PGN 棋谱                      ║
║    • crawl_user  - 抓取用户历史对局                   ║
║    • full_review - 完整复盘（analyze + review）        ║
╚═══════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});
