# Chess Coach - 系统架构

## 整体架构

```
Chrome 插件                          WebSocket Gateway              OpenClaw Gateway
    │                                       │                            │
    │  ws://your-server.com:18790          │                            │
    │──────────────────────────────────────▶│                            │
    │                                       │  HTTP 127.0.0.1:18789      │
    │                                       │──────────────────────────▶│
    │                                       │                            │
    │                                       │◀──────────────────────────│
    │◀──────────────────────────────────────│                            │
    │  { jsonrpc, result, id }              │                            │
    │                                       │                            │
    │                                       │              ┌─────┴─────┐
    │                                       │              │  chess-   │
    │                                       │              │orchestrator│
    │                                       │              │ (总管)    │
    │                                       │              └─────┬─────┘
    │                                       │                    │
    │                                       │                    │
    │                                       │   ┌────────────────┼────────────────┐
    │                                       │   ▼                ▼                ▼
    │                                       │ ┌──────────┐  ┌────────────┐  ┌─────────────┐
    │                                       │ │  chess-  │  │   chess-   │  │    chess-   │
    │                                       │ │ crawler  │──│  engine    │──│  analyst    │
    │                                       │ └──────────┘  └──────┬─────┘  └──────┬──────┘
    │                                       │                    │                 │
    │                                       │                    │                 ▼
    │                                       │                    │          ┌─────────────┐
    │                                       │                    │          │    chess-   │
    │                                       │                    │          │  reviewer   │
    │                                       │                    │          └──────┬──────┘
    │                                       │                    │                 │
    │                                       │                    │                 ▼
    │                                       │                    │          ┌─────────────┐
    │                                       │                    │          │    chess-   │
    │                                       │                    │          │gamification │
    │                                       │                    │          └─────────────┘
    └───────────────────────────────────────┴────────────────────┴─────────────────────┘
```

**重要说明：WebSocket Gateway 和 OpenClaw Gateway 必须部署在同一台机器上！**

- WebSocket Gateway 对外暴露 (端口 18790)
- OpenClaw Gateway 只监听 127.0.0.1:18789，不对外暴露
- 这样可以保护 OpenClaw 中的隐私信息不被直接访问

## chess-orchestrator (总管 Agent)

### 职责
- **接收外部 HTTP 请求**
- **解析 action 参数**
- **调度内部 Agent**
- **聚合返回结果**

### Action 路由

| action | 调度流程 |
|--------|---------|
| `analyze` | chess-engine → chess-analyst → chess-reviewer |
| `crawl_user` | chess-crawler |
| `full_review` | chess-engine → chess-analyst → chess-reviewer → chess-gamification |

## Multi-Agent 协作流程

### full_review 流程
```
用户输入 (PGN / 用户名)
           │
           ▼
┌─────────────────────────┐
│   chess-orchestrator    │
│   (接收 HTTP 请求)       │
└────────┬────────────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌───────┐ ┌────────┐ ┌──────────┐
│ chess-│ │ chess- │ │   ...    │
│crawler│ │ engine │ │          │
└───┬───┘ └───┬────┘ └──────────┘
    │          │
    │ PGN      │ 分析结果
    ▼          ▼
┌─────────────────────────────────┐
│        chess-analyst            │
│    (AI 深度复盘 + 教学建议)     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│        chess-reviewer           │
│      (生成趣味复盘卡片)          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│      chess-gamification         │
│      (XP/称号/成就更新)          │
└────────┬────────────────────────┘
         │
         ▼
      最终输出
```

## Agent 通信协议

### 1. orchestrator → crawler
```json
{
  "action": "crawl_user",
  "username": "player_name",
  "limit": 10
}
```

### 2. orchestrator → engine
```json
{
  "action": "analyze_game",
  "game_id": "abc123",
  "pgn": "(PGN字符串)"
}
```

### 3. orchestrator → analyst
```json
{
  "action": "deep_review",
  "game_id": "abc123",
  "pgn": "(PGN字符串)",
  "analysis": {
    "accuracy": 82.5,
    "blunders": [...],
    "brilliants": [...]
  }
}
```

### 4. orchestrator → reviewer + gamification
```json
{
  "action": "generate_review",
  "game_id": "abc123",
  "game_info": {...},
  "analysis": {...},
  "user_profile": {...}
}
```

### 5. 最终响应 (orchestrator → Chrome 插件)
```json
{
  "success": true,
  "data": {
    "review_card": "...",
    "xp_gained": 8,
    "new_titles": [],
    "new_achievements": [],
    "radar_data": {...}
  },
  "requestId": "req_xxx"
}
```

## Chrome 插件架构

```
chess-coach-extension/
├── manifest.json          # 插件配置
├── popup/                 # 弹窗 UI
│   ├── App.tsx
│   ├── components/
│   └── styles/
├── content/               # 内容脚本 (注入 chess.com)
│   └── content.ts
├── background/            # 后台服务
│   └── service.ts
└── utils/
    ├── chess.ts           # chess.js 封装
    ├── storage.ts          # chrome.storage 封装
    └── api.ts             # 调用 chess-orchestrator API
```

## 数据流

```
chess.com 页面
    │
    ▼ (content script 抓取)
background.js
    │
    ▼ (HTTP POST /api/chess-coach)
OpenClaw Gateway
    │
    ▼ (chess-orchestrator)
┌─────────────────────────────────────────┐
│          chess-orchestrator              │
│  1. chess-crawler (获取历史)             │
│  2. chess-engine (Stockfish 分析)        │
│  3. chess-analyst (AI 深度复盘)         │
│  4. chess-reviewer (趣味评语)            │
│  5. chess-gamification (XP/成就)        │
└─────────────────────────────────────────┘
    │
    ▼ (HTTP 响应)
Popup UI (游戏化复盘卡片)
```

## WebSocket Gateway

### 部署要求

**⚠️ 重要：WebSocket Gateway 必须和 OpenClaw Gateway 部署在同一台机器上！**

```
┌─────────────────────────────────────────────────────────────┐
│                      服务器 (124.156.195.28)                 │
│                                                             │
│  ┌─────────────────────┐        ┌─────────────────────────┐ │
│  │  WebSocket Gateway  │        │   OpenClaw Gateway     │ │
│  │     (0.0.0.0:18790) │◀──────│   (127.0.0.1:18789)   │ │
│  │   (对外暴露)        │ HTTP   │   (只监听本地)        │ │
│  └──────────┬──────────┘        └───────────┬─────────────┘ │
│             │                               │                 │
└─────────────┼───────────────────────────────┼─────────────────┘
              │                               │
              │ WebSocket                     │ (不出服务器)
              │ ws://0.0.0.0:18790           │
              ▼                               ▼
        Chrome Extension               内部通信
```

### 启动

```bash
npm run gateway  # 启动 WebSocket Gateway (port 18790)
```

### JSON-RPC 协议

**请求格式：**
```json
{
  "jsonrpc": "2.0",
  "method": "analyze",
  "params": {
    "action": "analyze",
    "pgn": "1.e4 e5 2.Nf3 Nc6",
    "userId": "user_123"
  },
  "id": 1
}
```

**响应格式：**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "data": {...}
  },
  "id": 1
}
```

### 支持的 method

| method | 说明 |
|--------|------|
| `analyze` | 分析 PGN 棋谱 |
| `crawl_user` | 抓取用户历史对局 |
| `full_review` | 完整复盘 (analyze + review) |

### 安全建议

1. **防火墙** - 只开放 WebSocket 端口 (18790)，不要开放 OpenClaw 端口 (18789)
2. **API Key** - 建议在 WebSocket Gateway 添加 API Key 验证
3. **Nginx** - 可以加一层 Nginx 做 SSL 终止和 Basic Auth

## Mock API Server

用于开发和测试，不连接真实 OpenClaw。

```bash
npm run api:mock  # 启动 Mock Server (port 18789)
```

**端点**: `POST http://localhost:18789/api/chess-coach`

---

*版本：v2.2 | 更新：2026-04-05*
