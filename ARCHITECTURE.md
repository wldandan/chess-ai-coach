# Chess Coach - 系统架构

## Multi-Agent 协作流程

```
用户输入 (chess.com 用户名/对局链接)
           │
           ▼
┌─────────────────────────┐
│     Orchestrator        │
│   (协调 Agent)          │
│  接收请求，分发任务      │
└────────┬────────────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌───────┐ ┌────────┐ ┌──────────┐
│Crawler│ │Analyzer│ │Gamification│
│ Agent │ │ Agent  │ │  Agent   │
└───┬───┘ └────┬───┘ └────┬────┘
    │          │          │
    ▼          ▼          ▼
  PGN       分析结果    用户数据
    │          │          │
    └──────────┼──────────┘
               ▼
    ┌─────────────────────┐
    │    Reviewer Agent   │
    │  生成趣味复盘报告    │
    └──────────┬──────────┘
               │
               ▼
         最终输出卡片
```

## Agent 通信协议

### 1. Crawler → Analyzer
```json
{
  "action": "analyze_game",
  "game_id": "abc123",
  "pgn": "(PGN字符串)",
  "user": "player_name"
}
```

### 2. Analyzer → Reviewer
```json
{
  "action": "generate_review",
  "game_id": "abc123",
  "accuracy": 82.5,
  "blunders": [...],
  "brilliants": [...],
  "game_info": {...}
}
```

### 3. Reviewer + Gamification → 最终输出
```json
{
  "review_card": "...",
  "xp_gained": 8,
  "new_titles": [],
  "new_achievements": []
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
├── agents/                # OpenClaw Agent 调用
│   └── index.ts
└── utils/
    ├── chess.ts           # chess.js 封装
    ├── storage.ts          # chrome.storage 封装
    └── api.ts             # chess.com API
```

## 数据流

```
chess.com 页面
    │
    ▼ (content script 抓取)
background.js
    │
    ▼ (消息传递)
OpenClaw Agent (crawler)
    │
    ▼
chess.com API (PGN)
    │
    ▼
OpenClaw Agent (analyzer)
    │
    ▼
Stockfish WASM (浏览器内)
    │
    ▼
OpenClaw Agent (reviewer + gamification)
    │
    ▼
Popup UI (游戏化复盘卡片)
```
