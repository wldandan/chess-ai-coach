/**
 * Chess Coach Gateway
 *
 * 中间层服务 - 支持 OpenClaw 和 OpenCode 两条分析路径
 *
 * 架构：
 *   Extension (HTTP) → gateway.js (:18790)
 *                          │
 *                          ├── OpenClaw (WebSocket) → chess agents
 *                          │   ws://127.0.0.1:18789
 *                          │
 *                          └── OpenCode (HTTP) → LLM + chess skill
 *                              https://api.opencode.ai/v1/chat/completions
 *
 * 启动：node src/api/gateway.js
 * HTTP 端口：18790 (对外)
 */

const { WebSocket } = require('ws');
const http = require('http');

// ============================
// 配置
// ============================
const GATEWAY_PORT = 18790;
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'ws://127.0.0.1:18789';
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || '6fb45eed3740d32a7d04e4d9e6327b7a3238381338620202288d66b307c55ca7';

// OpenCode 配置
const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY || '';
const OPENCODE_API_URL = process.env.OPENCODE_API_URL || 'https://api.opencode.ai/v1/chat/completions';
const OPENCODE_MODEL = process.env.OPENCODE_MODEL || 'opencode/gpt-4o';

// ============================
// 工具函数
// ============================

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}


// ============================
// OpenClaw 连接管理
// ============================

class OpenClawClient {
  constructor() {
    this.ws = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
    this.connected = false;
    this.connect();
  }

  connect() {
    console.log(`[${generateRequestId()}] Connecting to OpenClaw at ${OPENCLAW_URL}...`);

    this.ws = new WebSocket(OPENCLAW_URL);

    this.ws.on('open', () => {
      console.log(`[${generateRequestId()}] Connected to OpenClaw Gateway`);
      this.connected = true;
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());

      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject, timer } = this.pendingRequests.get(message.id);
        clearTimeout(timer);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          reject(new Error(message.error.message || 'OpenClaw error'));
        } else {
          resolve(message.result || message);
        }
      }
    });

    this.ws.on('close', () => {
      console.log(`[${generateRequestId()}] Disconnected from OpenClaw`);
      this.connected = false;

      setTimeout(() => {
        console.log(`[${generateRequestId()}] Reconnecting to OpenClaw...`);
        this.connect();
      }, 5000);
    });

    this.ws.on('error', (error) => {
      console.error(`[${generateRequestId()}] OpenClaw WebSocket error:`, error.message);
    });
  }

  async send(type, params = {}) {
    if (!this.connected || !this.ws) {
      throw new Error('Not connected to OpenClaw Gateway');
    }

    const id = ++this.requestId;
    const message = {
      type: type,
      params: params,
      id: id,
    };

    console.log(`[${generateRequestId()}] Sending to OpenClaw:`, JSON.stringify(message).slice(0, 100));

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request to OpenClaw Gateway timeout'));
        }
      }, 120000);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify(message));
    });
  }
}

const openclaw = new OpenClawClient();

// ============================
// OpenCode HTTP Client
// ============================

class OpenCodeClient {
  constructor() {
    this.apiKey = OPENCODE_API_KEY;
    this.apiUrl = OPENCODE_API_URL;
    this.model = OPENCODE_MODEL;
  }

  async analyze(pgn, userId) {
    if (!this.apiKey) {
      throw new Error('OpenCode API key not configured. Set OPENCODE_API_KEY environment variable.');
    }

    // 直接发送 PGN 给 OpenCode，让 OpenCode 使用已配置的 skill 进行分析
    const userMessage = `请分析以下棋局（PGN格式）：
${pgn}

用户: ${userId || 'anonymous'}`;

    console.log(`[${generateRequestId()}] Calling OpenCode API with model: ${this.model}`);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenCode API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('OpenCode API returned empty response');
    }

    // 解析 JSON 响应
    try {
      // 尝试提取 JSON（可能包含在 markdown 代码块中）
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error(`[${generateRequestId()}] Failed to parse OpenCode response:`, content.slice(0, 200));
      throw new Error('Failed to parse OpenCode response as JSON');
    }
  }
}

const opencode = new OpenCodeClient();

// ============================
// HTTP 服务器
// ============================

const server = http.createServer();

server.on('request', async (req, res) => {
  const reqId = generateRequestId();
  console.log(`[${reqId}] ${req.method} ${req.url}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  // 健康检查
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      openclawConnected: openclaw.connected,
      opencodeConfigured: !!OPENCODE_API_KEY,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // API 端点
  if (req.method === 'POST' && req.url === '/api/chess-coach') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      console.log(`[${reqId}] Received: ${body.slice(0, 200)}`);

      // 验证 API Key
      const apiKey = req.headers['authorization']?.replace('Bearer ', '');
      if (apiKey !== GATEWAY_API_KEY) {
        console.log(`[${reqId}] Unauthorized: invalid API key`);
        sendJson(res, 401, { success: false, error: 'Unauthorized: invalid API key' });
        return;
      }

      let request;
      try {
        request = JSON.parse(body);
      } catch (e) {
        sendJson(res, 400, { success: false, error: 'Invalid JSON' });
        return;
      }

      const { action, pgn, userId, username, limit, provider } = request;
      console.log(`[${reqId}] Action: ${action}, Provider: ${provider || 'openclaw (default)'}`);

      try {
        let result;

        // 根据 provider 选择分析路径
        const analysisProvider = provider || 'openclaw';

        switch (analysisProvider) {
          case 'openclaw':
            // OpenClaw WebSocket 路径
            switch (action) {
              case 'analyze':
                result = await openclaw.send('analyze', { pgn, userId });
                break;
              case 'crawl_user':
                result = await openclaw.send('crawl_user', { username, limit });
                break;
              case 'full_review':
                result = await openclaw.send('full_review', { pgn, userId, username });
                break;
              default:
                throw new Error(`Unknown action: ${action}`);
            }
            break;

          case 'opencode':
            // OpenCode HTTP 路径
            if (!OPENCODE_API_KEY) {
              throw new Error('OpenCode API key not configured');
            }
            switch (action) {
              case 'analyze':
                result = await opencode.analyze(pgn, userId);
                break;
              case 'full_review':
                // OpenCode 不支持 full_review（需要 crawl），改为调用 analyze
                result = await opencode.analyze(pgn, userId);
                break;
              default:
                throw new Error(`Action '${action}' not supported with OpenCode provider`);
            }
            break;

          default:
            throw new Error(`Unknown provider: ${analysisProvider}`);
        }

        console.log(`[${reqId}] Response success`);
        sendJson(res, 200, { success: true, data: result, requestId: reqId, provider: analysisProvider });
      } catch (error) {
        console.error(`[${reqId}] Error:`, error.message);
        sendJson(res, 500, { success: false, error: error.message, requestId: reqId });
      }
    });
    return;
  }

  // 404
  sendJson(res, 404, { error: 'Not found' });
});

// ============================
// 启动
// ============================

server.listen(GATEWAY_PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              🎯 Chess Coach Gateway                          ║
╠═══════════════════════════════════════════════════════════════╣
║  HTTP Port: ${GATEWAY_PORT} (对外)                                ║
╠═══════════════════════════════════════════════════════════════╣
║  分析路径:                                                ║
║    OpenClaw: ws://127.0.0.1:18789 (WebSocket)              ║
║    OpenCode: ${OPENCODE_API_URL}              ║
║             Model: ${OPENCODE_MODEL}                     ║
╠═══════════════════════════════════════════════════════════════╣
║  认证:                                                    ║
║    Header: Authorization: Bearer <API_KEY>                  ║
║    默认密钥: ${GATEWAY_API_KEY.slice(0, 20)}...                       ║
╠═══════════════════════════════════════════════════════════════╣
║  REST API:                                                ║
║    POST /api/chess-coach                                  ║
║    GET  /health                                           ║
║                                                           ║
║  Body:                                                    ║
║    {                                                      ║
║      "action": "analyze" | "full_review",                 ║
║      "pgn": "...",                                        ║
║      "userId": "...",                                     ║
║      "provider": "openclaw" | "opencode"  // 可选，默认 openclaw ║
║    }                                                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Gateway...');
  if (openclaw.ws) {
    openclaw.ws.close();
  }
  server.close();
  process.exit(0);
});
