/**
 * Chess Coach Mock API Server
 * 
 * 运行方式: npx ts-node src/api/server.ts
 * 端口: 3000
 * 端点: http://localhost:3000/api/chess-coach
 */

import express, { Request, Response } from 'express';
import { handleApiRequest, AnalyzeRequest, CrawlUserRequest, FullReviewRequest } from './mock';

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

// API endpoint
app.post('/api/chess-coach', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    console.log('Request:', JSON.stringify(body, null, 2));
    
    const result = await handleApiRequest(
      body as AnalyzeRequest | CrawlUserRequest | FullReviewRequest
    );
    
    console.log('Response:', result.success ? '✅ success' : '❌ error');
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
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
║       🎯 Chess Coach API Mock Server                  ║
╠═══════════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                          ║
║  Endpoint: POST /api/chess-coach                       ║
╠═══════════════════════════════════════════════════════╣
║  Actions:                                             ║
║    • analyze      - 分析 PGN 棋谱                    ║
║    • crawl_user   - 抓取用户历史对局                  ║
║    • full_review - 完整复盘（analyze + review）       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});
