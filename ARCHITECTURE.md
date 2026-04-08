# Chess Coach - 系统架构

## Monorepo 结构

```
chess-ai-coach/
│
├── chrome-extension/           # Chrome 插件
│   ├── entrypoints/          #   popup, options, content, details
│   ├── src/                  #   gamification, shared
│   ├── public/              #   静态资源
│   ├── .wxt/                #   WXT 配置
│   ├── wxt.config.ts
│   └── package.json
│
├── api-server/               # API 服务
│   ├── src/
│   │   ├── gateway.ts       #   HTTP 网关（唯一入口）
│   │   └── mock-*.json     #   Mock 数据
│   ├── package.json
│   └── tsconfig.json
│
└── agents/                  # Agent SKILL.md 定义
    ├── chess-orchestrator/  #   编排 Agent
    ├── chess-engine/        #   引擎分析 Agent
    ├── chess-analyst/       #   AI 复盘分析 Agent
    ├── chess-crawler/       #   棋谱抓取 Agent
    ├── chess-reviewer/      #   趣味评语 Agent
    └── chess-gamification/  #   游戏化 Agent
```

## 整体架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Chess Coach Chrome Extension                                 │
│                           (chrome-extension/)                                  │
│                                      │                                           │
│                                      │ POST /api/chess-coach                    │
│                                      │ Authorization: Bearer <API_KEY>           │
│                                      ▼                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                          Gateway (:18790)                                      │
│                   (api-server/src/gateway.ts - 独立实现)                       │
│                                                                                 │
│   职责：                                                                        │
│   - HTTP 服务，监听 18790 端口                                                   │
│   - API Key 认证                                                                │
│   - 棋局分析逻辑（不依赖 OpenClaw/OpenCode）                                     │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   OpenClaw / OpenCode (外部运行时，读取 agents/*.SKILL.md)                       │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      agents/*.SKILL.md                                  │   │
│   │   chess-orchestrator / chess-engine / chess-analyst                     │   │
│   │   chess-crawler / chess-reviewer / chess-gamification                   │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 组件职责

| 组件 | 目录 | 职责 |
|------|------|------|
| Chrome Extension | `chrome-extension/` | 插件 UI（popup, content script） |
| API Gateway | `api-server/src/gateway.ts` | HTTP 入口，路由到 OpenClaw/OpenCode |
| OpenClaw/OpenCode | 外部运行时 | 读取 `agents/*.SKILL.md` 并执行 |

### Gateway (`api-server/src/gateway.ts`)

**HTTP 入口**，路由到 OpenClaw 或 OpenCode。

| 职责 | 说明 |
|------|------|
| HTTP 服务 | 监听 18790 端口 |
| 认证 | Bearer API_KEY 验证 |
| 路由分发 | 根据 `provider` 路由到 OpenClaw 或 OpenCode |

### Agent 定义 (`agents/`)

**纯 SKILL.md 定义**，不包含实现代码。

| Agent | 职责 |
|-------|------|
| `chess-orchestrator` | 编排入口，调度其他 Agent |
| `chess-engine` | Stockfish 漏着/妙着分析 |
| `chess-analyst` | AI 深度复盘分析（失误讲解、教学建议） |
| `chess-crawler` | chess.com 对局抓取 |
| `chess-reviewer` | LLM 生成趣味复盘卡片 |
| `chess-gamification` | XP/称号/成就/雷达图系统 |

## API 接口

### 请求格式

```json
POST /api/chess-coach
Authorization: Bearer <API_KEY>

{
  "action": "analyze" | "crawl_user" | "full_review",
  "pgn": "1.e4 e5 2.Nf3 Nc6",
  "userId": "user_123",
  "username": "player_name",
  "provider": "openclaw" | "opencode"
}
```

### 响应格式

```json
{
  "success": true,
  "data": { ... },
  "requestId": "req_xxx",
  "provider": "openclaw"
}
```

## 服务端口

| 服务 | 端口 | 文件 | 说明 |
|------|------|------|------|
| **Gateway** | 18790 | `api-server/src/gateway.ts` | 插件入口 |
| **OpenClaw** | 18789 | 外部服务 | WebSocket 连接 |
| **OpenCode** | 443 | `api.opencode.ai` | HTTPS API |
| **Mock Server** | 18789 | `api-server/src/mock-server.js` | 开发调试用 |

## 启动命令

| 目录 | 命令 | 服务 | 端口 |
|------|------|------|------|
| `chrome-extension/` | `npm run dev` | WXT Dev Server | - |
| `api-server/` | `npm run gateway` | Gateway | 18790 |
| `api-server/` | `npm run mock` | Mock Server | 18789 |
| - | `openclaw serve` | OpenClaw | 18789 |
| - | `opencode serve` | OpenCode | 4096 |

## Action 路由

| Action | OpenClaw | OpenCode |
|--------|----------|----------|
| `analyze` | ✅ | ✅ |
| `crawl_user` | ✅ | ❌ |
| `full_review` | ✅ | ❌ |

## 安全建议

1. **Gateway** 对外暴露，**OpenClaw** 只监听 localhost
2. 使用 `Authorization: Bearer <API_KEY>` 认证
3. 生产环境建议加一层 Nginx 做 SSL 终止

## 测试

### 测试框架

使用 **Playwright** 进行自动化测试。

### 测试文件

```
chrome-extension/tests/
├── mock-server.spec.ts     # 5 tests  - Mock API 测试
├── popup.spec.ts           # 7 tests  - 构建产物测试
├── helpers/
│   └── extension-loader.ts
└── e2e/
    ├── chesscom.spec.ts   # 2 tests  - chess.com E2E 测试
    └── .env.example       # 环境变量模板
```

### 运行测试

```bash
cd chrome-extension

# 所有测试（headless）
npm test

# UI 模式
npm run test:ui

# headed 模式（显示浏览器）
npm run test:headed

# 只运行 E2E 测试
npx playwright test tests/e2e/
```

### E2E 测试（真实 chess.com）

需要 chess.com 账号：

```bash
# 1. 配置环境变量
cp tests/e2e/.env.example tests/e2e/.env
# 编辑 .env 填入账号密码

# 2. 运行 E2E 测试
npx playwright test tests/e2e/
```

### Mock Server 端口更正

| 服务 | 端口 | 说明 |
|------|------|------|
| Mock Server | **18889** | 18789 被 OpenClaw 占用 |

---

*版本：v0.5.0 | 更新：2026-04-08*
