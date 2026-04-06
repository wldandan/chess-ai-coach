# ♟️ Chess AI Coach - AI 国际象棋复盘 Chrome 插件

> 给 14 岁孩子的趣味国际象棋复盘工具 🏆⭐🎮

## 功能特色

- 🎯 **智能复盘** - 一键分析 chess.com 对局，发现漏着与妙着
- 🏆 **游戏化系统** - XP 经验值、称号成就、雷达图能力分析
- 💬 **趣味评语** - AI 生成符合青少年口吻的复盘解说
- ⚡ **快速响应** - 插件即点即用，无需切换页面

## 目录结构

```
chess-ai-coach/
│
├── chrome-extension/           # Chrome 插件
│   ├── entrypoints/          #   popup, options, content, details
│   ├── src/                  #   gamification, shared
│   └── package.json
│
├── api-server/               # API 服务
│   └── src/
│       └── gateway.ts       #   HTTP 网关
│
└── agents/                  # Agent SKILL.md 定义
    ├── chess-orchestrator/
    ├── chess-engine/
    ├── chess-analyst/
    ├── chess-crawler/
    ├── chess-reviewer/
    └── chess-gamification/
```

## 系统架构

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
│                   (api-server/src/gateway.ts)                                 │
│                                      │                                           │
│                    ┌─────────────────┴─────────────────┐                      │
│                    │                               │                          │
│              ┌─────▼─────┐                   ┌─────▼─────┐                    │
│              │ OpenClaw  │                   │  OpenCode │                    │
│              │(WebSocket)│                   │   (HTTP)  │                    │
│              │  :18789   │                   │   API     │                    │
│              └───────────┘                   └───────────┘                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## API 接口

**入口**: `POST /api/chess-coach`

| Action | 说明 | OpenClaw | OpenCode |
|--------|------|----------|----------|
| `analyze` | 分析 PGN 棋谱 | ✅ | ✅ |
| `crawl_user` | 抓取用户历史对局 | ✅ | ❌ |
| `full_review` | 完整复盘（一条龙）| ✅ | ❌ |

### 请求格式

```json
// analyze - 分析 PGN
{
  "action": "analyze",
  "pgn": "1.e4 e5 2.Nf3 Nc6",
  "userId": "xxx",
  "provider": "openclaw" | "opencode"
}
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "gameId": "game_xxx",
    "analysis": { "accuracy": 82.5, "blunders": [...], "brilliants": [...] },
    "review": { "markdown": "...", "html": "..." },
    "gamification": { "xpGained": 8, "newTitles": [...], "radarData": {...} }
  },
  "requestId": "req_xxx",
  "provider": "openclaw"
}
```

## Agent 分工

| Agent | 职责 | 实现 |
|-------|------|------|
| `chess-orchestrator` | 编排入口，调度其他 Agent | SKILL.md |
| `chess-crawler` | chess.com 对局抓取 | SKILL.md |
| `chess-engine` | Stockfish 漏着/妙着分析 | SKILL.md |
| `chess-analyst` | AI 深度复盘分析 | SKILL.md |
| `chess-reviewer` | LLM 生成趣味复盘卡片 | SKILL.md |
| `chess-gamification` | XP/称号/成就/雷达图 | SKILL.md |

## 开发

```bash
# Chrome 插件
cd chrome-extension
npm install
npm run dev      # 开发模式
npm run build    # 构建

# API 服务
cd ../api-server
npm install
npm run gateway  # 启动 Gateway (端口 18790)
npm run mock     # 启动 Mock Server (端口 18789)
```

## Tech Stack

- **Chrome 插件**: WXT 框架 (MV3)
- **API 网关**: gateway.ts (TypeScript)
- **Multi-Agent**: OpenClaw / OpenCode
- **Agent 定义**: SKILL.md
- **棋谱解析**: chess.js
- **引擎分析**: Stockfish WASM
- **UI**: React + 游戏化风格卡片

---

*版本：v5.0 | 更新：2026-04-06*
