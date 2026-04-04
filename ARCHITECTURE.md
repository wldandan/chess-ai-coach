# Chess Coach - 系统架构

## 整体架构

```
Chrome 插件                          OpenClaw Gateway
    │                                       │
    │  POST /api/chess-coach                │
    │──────────────────────────────────────▶│
    │                                       │
    │◀──────────────────────────────────────│
    │  { success, data, requestId }          │
    │                                       │
    │                                 ┌─────┴─────┐
    │                                 │  chess-   │
    │                                 │orchestrator│
    │                                 │ (总管)    │
    │                                 └─────┬─────┘
    │                                       │
    │                    ┌──────────────────┼──────────────────┐
    │                    ▼                  ▼                  ▼
    │              ┌──────────┐      ┌────────────┐     ┌─────────────┐
    │              │  chess-  │      │   chess-   │     │    chess-   │
    │              │ crawler  │─────▶│  engine    │────▶│  analyst    │
    │              └──────────┘      └──────┬─────┘     └──────┬──────┘
    │                                          │                 │
    │                                          │                 │
    │                                          │                 ▼
    │                                          │         ┌─────────────┐
    │                                          │         │    chess-   │
    │                                          │         │  reviewer   │
    │                                          │         └──────┬──────┘
    │                                          │                │
    │                                          │                ▼
    │                                          │         ┌─────────────┐
    │                                          │         │    chess-   │
    │                                          │         │gamification │
    │                                          │         └─────────────┘
    └──────────────────────────────────────────┴─────────────────────┘
```

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

## Mock API Server

用于开发和测试，不连接真实 OpenClaw。

```bash
npm run api  # 启动 Mock Server (port 3000)
```

**端点**: `POST http://localhost:3000/api/chess-coach`

---

*版本：v2.2 | 更新：2026-04-04*
