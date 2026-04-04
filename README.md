# ♟️ Chess AI Coach - AI 国际象棋复盘 Chrome 插件

> 给 14 岁孩子的趣味国际象棋复盘工具 🏆⭐🎮

## 功能特色

- 🎯 **智能复盘** - 一键分析 chess.com 对局，发现漏着与妙着
- 🏆 **游戏化系统** - XP 经验值、称号成就、雷达图能力分析
- 💬 **趣味评语** - AI 生成符合青少年口吻的复盘解说
- ⚡ **快速响应** - 插件即点即用，无需切换页面

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                 Chrome Extension (浏览器内)                │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │                    Popup UI                        │  │
│  │               (游戏化复盘卡片)                      │  │
│  └──────────────────────────────────────────────────┘  │
│                            │                            │
│  ┌─────────────────────────┼──────────────────────┐    │
│  │                         │                       │    │
│  ▼                         ▼                       │    │
│ ┌────────────┐     ┌─────────────────┐             │    │
│ │  Background │────▶│ Content Script  │             │    │
│ │  Service   │     │ (当前页面抓取)   │             │    │
│ └─────┬──────┘     └────────┬────────┘             │    │
│       │                      │                        │    │
│       │                      │ 提取当前对局 PGN        │    │
│       │                      │                        │    │
│       │    ┌──────────────────┘                        │    │
│       │    │                                           │    │
│       ▼    ▼                                           │    │
│  ┌─────────────────────────────────────────────┐      │
│  │              chrome.storage.local            │      │
│  │              (用户数据本地持久化)             │      │
│  └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                          │ HTTP API
                          ▼
┌─────────────────────────────────────────────────────────┐
│              chess-orchestrator (总管 Agent)              │
│                    OpenClaw Gateway                      │
│                 POST /api/chess-coach                   │
└───────────────────────────┬─────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌────────────────┐ ┌──────────────┐ ┌─────────────────┐
│ chess-crawler  │ │chess-engine  │ │ chess-analyst   │
│  (历史存档)    │ │ (Stockfish) │ │ (AI 深度复盘)   │
└────────────────┘ └──────────────┘ └────────┬────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                    ┌─────────────────┐          ┌─────────────────┐
                    │chess-reviewer   │          │chess-gamification│
                    │  (趣味评语)     │          │  (XP/称号/成就)  │
                    └─────────────────┘          └─────────────────┘
```

## API 接口

**入口**: `POST /api/chess-coach`

| Action | 说明 | 返回 |
|--------|------|------|
| `analyze` | 分析 PGN 棋谱 | accuracy, blunders, brilliants, phaseScores |
| `crawl_user` | 抓取用户历史对局 | username, games[] |
| `full_review` | 完整复盘（一条龙）| gameInfo, analysis, review, gamification, chessAnalyst |

### 请求格式

```json
// analyze - 分析 PGN
{
  "action": "analyze",
  "pgn": "1.e4 e5 2.Nf3 Nc6",
  "userId": "xxx"
}

// crawl_user - 抓取用户历史
{
  "action": "crawl_user",
  "username": "MagnusFan2024",
  "limit": 10
}

// full_review - 完整复盘
{
  "action": "full_review",
  "pgn": "1.e4 e5 2.Nf3 Nc6 3.Bb5 a6",
  "userId": "xxx",
  "username": "ChessKid"
}
```

### 响应格式

```json
{
  "success": true,
  "data": {
    "gameId": "game_xxx",
    "gameInfo": { ... },
    "analysis": { "accuracy": 82.5, "blunders": [...], "brilliants": [...] },
    "review": { "markdown": "...", "html": "..." },
    "gamification": { "xpGained": 8, "newTitles": [...], "radarData": {...} },
    "chessAnalyst": { "summary": "...", "keyMistakes": [...], "bestMoves": [...], "todayLesson": "..." }
  },
  "requestId": "req_xxx"
}
```

## Agent 分工

| Agent | 职责 | 入口 |
|-------|------|------|
| `chess-orchestrator` | 对外 API 入口，调度内部 Agent | ✅ 核心入口 |
| `chess-crawler` | chess.com API 历史存档读取 | 被 orchestrator 调用 |
| `chess-engine` | Stockfish 引擎分析漏着/妙着 | 被 orchestrator 调用 |
| `chess-analyst` | AI 深度复盘分析（失误讲解、教学建议） | 被 orchestrator 调用 |
| `chess-reviewer` | LLM 生成趣味复盘卡片 | 被 orchestrator 调用 |
| `chess-gamification` | XP/称号/成就/雷达图 | 被 orchestrator 调用 |

## chess-analyst Agent

**角色**：耐心的国际象棋教练，专门帮助 14 岁左右的孩子提高棋艺。

**核心能力**：
- 📊 棋局概览（结果、回合数、时间控制）
- 🎯 亮点时刻（值得肯定的着法）
- ⚠️ 关键失误（按重要性排序，含正确着法建议）
- 💡 可优化之处
- 📚 开局学习建议
- 🌟 今日收获

**触发词**：`帮我分析` / `复盘` / `这盘棋` / `chess analysis`

## 输出示例

```
⚔️ 对局复盘：vs MagnusCarlsen (2026-03-30)
🏆 结果：胜利！(+8 XP)

⭐ 准确率：78%
🔴 漏着：第24步 - 象d3 ❌ (+1.2)
🟡 妙着：第31步 - 后c6 ✨ (+2.5)

💬 "进攻很凶，但防守有点浪 😂"
🏅 获得称号：「漏着猎人」
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 启动 Mock API Server
npm run api

# 构建发布
npm run build
```

## Tech Stack

- **Chrome 插件**: WXT 框架
- **多 Agent**: OpenClaw
- **API 网关**: chess-orchestrator
- **AI 复盘**: chess-analyst Agent
- **棋谱解析**: chess.js
- **引擎分析**: Stockfish WASM
- **LLM**: baoyu (已有)
- **UI**: 游戏化风格卡片

---

*版本：v2.2 | 更新：2026-04-04*
