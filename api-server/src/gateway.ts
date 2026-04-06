/**
 * Chess Coach Gateway
 *
 * HTTP 网关 - 统一入口，路由到 OpenClaw 或 OpenCode
 *
 * 架构：
 *   Extension (HTTP) → gateway.ts (:18790)
 *                          │
 *              ┌───────────┴───────────┐
 *              ▼                       ▼
 *         OpenClaw               OpenCode
 *        (WebSocket)              (HTTP API)
 *              │                       │
 *              └───────────┬───────────┘
 *                          ▼
 *                    agents/*.SKILL.md
 *
 * 启动：npx ts-node src/api/gateway.ts
 * HTTP 端口：18790 (对外)
 */

import http from 'http';
import { WebSocket } from 'ws';

// ============================
// 配置
// ============================
const GATEWAY_PORT = 18790;
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || '6fb45eed3740d32a7d04e4d9e6327b7a3238381338620202288d66b307c55ca7';

// OpenClaw 配置
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'ws://127.0.0.1:18789';
const OPENCLAW_TIMEOUT = 120000;

// OpenCode 配置
const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY || '';
const OPENCODE_API_URL = process.env.OPENCODE_API_URL || 'https://api.opencode.ai/v1/chat/completions';
const OPENCODE_MODEL = process.env.OPENCODE_MODEL || 'minimax/MiniMax-M2.2';

// ============================
// 工具函数
// ============================

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// ============================
// OpenClaw Client
// ============================

class OpenClawClient {
  private ws: WebSocket | null = null;
  private connected = false;
  private pendingRequests = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
  private requestId = 0;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[Gateway] Connecting to OpenClaw at ${OPENCLAW_URL}...`);

      this.ws = new WebSocket(OPENCLAW_URL);

      const timeout = setTimeout(() => {
        reject(new Error('OpenClaw connection timeout'));
      }, 10000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        this.connected = true;
        console.log('[Gateway] Connected to OpenClaw');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.id && this.pendingRequests.has(message.id)) {
            const { resolve, reject, timer } = this.pendingRequests.get(message.id)!;
            clearTimeout(timer);
            this.pendingRequests.delete(message.id);
            if (message.error) {
              reject(new Error(message.error.message || 'OpenClaw error'));
            } else {
              resolve(message.result || message);
            }
          }
        } catch (e) {
          console.error('[Gateway] Failed to parse OpenClaw message:', e);
        }
      });

      this.ws.on('close', () => {
        this.connected = false;
        console.log('[Gateway] OpenClaw disconnected');
      });

      this.ws.on('error', (error) => {
        console.error('[Gateway] OpenClaw error:', error.message);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async send(type: string, params: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || !this.connected) {
      throw new Error('Not connected to OpenClaw');
    }

    const id = ++this.requestId;
    const message = { type, params, id };

    console.log(`[Gateway] Sending to OpenClaw:`, type);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('OpenClaw request timeout'));
      }, OPENCLAW_TIMEOUT);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.ws!.send(JSON.stringify(message));
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const openclaw = new OpenClawClient();

// 启动时连接 OpenClaw
openclaw.connect().catch((e) => {
  console.warn('[Gateway] OpenClaw not available:', e.message);
});

// ============================
// OpenCode Client
// ============================

class OpenCodeClient {
  constructor(
    private apiKey: string,
    private apiUrl: string,
    private model: string
  ) {}

  async analyze(pgn: string, userId?: string): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('OpenCode API key not configured. Set OPENCODE_API_KEY environment variable.');
    }

    const userMessage = `请分析以下棋局（PGN格式）：
${pgn}

用户: ${userId || 'anonymous'}`;

    console.log(`[Gateway] Calling OpenCode API with model: ${this.model}`);

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
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('[Gateway] Failed to parse OpenCode response:', content.slice(0, 200));
      throw new Error('Failed to parse OpenCode response as JSON');
    }
  }
}

const opencode = new OpenCodeClient(OPENCODE_API_KEY, OPENCODE_API_URL, OPENCODE_MODEL);

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
      openclawConnected: openclaw.isConnected(),
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

      let request: {
        action: string;
        pgn?: string;
        userId?: string;
        username?: string;
        limit?: number;
        provider?: 'openclaw' | 'opencode';
      };
      try {
        request = JSON.parse(body);
      } catch (e) {
        sendJson(res, 400, { success: false, error: 'Invalid JSON' });
        return;
      }

      const { action, pgn, userId, username, limit, provider } = request;
      console.log(`[${reqId}] Action: ${action}, Provider: ${provider || 'openclaw'}`);

      try {
        const analysisProvider = provider || 'openclaw';
        let result: unknown;

        switch (analysisProvider) {
          case 'openclaw':
            if (!openclaw.isConnected()) {
              throw new Error('OpenClaw is not connected. Please ensure OpenClaw is running.');
            }
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
            if (!OPENCODE_API_KEY) {
              throw new Error('OpenCode API key not configured');
            }
            switch (action) {
              case 'analyze':
                result = await opencode.analyze(pgn!, userId);
                break;
              case 'full_review':
                result = await opencode.analyze(pgn!, userId);
                break;
              default:
                throw new Error(`Action '${action}' not supported with OpenCode provider (only analyze available)`);
            }
            break;

          default:
            throw new Error(`Unknown provider: ${analysisProvider}`);
        }

        console.log(`[${reqId}] Response success`);
        sendJson(res, 200, { success: true, data: result, requestId: reqId, provider: analysisProvider });
      } catch (error) {
        console.error(`[${reqId}] Error:`, error);
        sendJson(res, 500, { success: false, error: error instanceof Error ? error.message : 'Internal error', requestId: reqId });
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
║  架构:                                                      ║
║    Gateway (HTTP)                                           ║
║         │                                                   ║
║    ┌─────┴─────┐                                           ║
║    ▼           ▼                                           ║
║ OpenClaw   OpenCode                                         ║
║ (WebSocket) (HTTP API)                                      ║
║    │           │                                           ║
║    └─────┬─────┘                                           ║
║          ▼                                                 ║
║    agents/*.SKILL.md                                        ║
╠═══════════════════════════════════════════════════════════════╣
║  认证:                                                      ║
║    Header: Authorization: Bearer <API_KEY>                  ║
║    默认密钥: ${GATEWAY_API_KEY.slice(0, 20)}...                       ║
╠═══════════════════════════════════════════════════════════════╣
║  REST API:                                                  ║
║    POST /api/chess-coach                                    ║
║    GET  /health                                             ║
║                                                           ║
║  Body:                                                      ║
║    {                                                        ║
║      "action": "analyze" | "crawl_user" | "full_review",   ║
║      "pgn": "...",                                         ║
║      "userId": "...",                                      ║
║      "username": "...",                                     ║
║      "provider": "openclaw" | "opencode"                    ║
║    }                                                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Gateway...');
  openclaw.disconnect();
  server.close();
  process.exit(0);
});
