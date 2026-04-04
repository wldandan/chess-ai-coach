---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
workflowType: 'architecture'
classification:
  projectType: Chrome Extension (WXT + OpenClaw)
  domain: Education / Gaming (Chess Learning)
  complexity: Medium
  projectContext: Existing (v2.2)
---

# Architecture Decision Document - Chess Coach

_This document reflects the current Chess Coach v2.2 implementation._

## Project Context

### Requirements Overview

**Functional Requirements:**
- **Chrome 插件 UI** (3个): 右键菜单、新标签页展示、游戏化复盘卡片
- **API 网关** (1个): chess-orchestrator 统一入口
- **棋局分析** (4个): PGN 解析、Stockfish 引擎分析、Top N 提升点识别、最佳走法建议
- **LLM 解释** (2个): 趣味评语生成、儿童友好语言
- **游戏化系统** (4个): XP 经验值、称号成就、雷达图能力分析

**Non-Functional Requirements:**
- 性能：插件即点即用，分析响应 < 10秒
- 可访问性：WCAG 2.1 AA 基础标准
- 集成：chess.com 页面兼容、OpenClaw Agent 系统

### Technical Stack

| 层级 | 技术 |
|------|------|
| Chrome 插件框架 | WXT (MV3) |
| API 网关 | chess-orchestrator |
| Multi-Agent 系统 | OpenClaw |
| 棋谱解析 | chess.js |
| 引擎分析 | Stockfish WASM |
| 数据存储 | chrome.storage.local |

---

## Component Architecture

### High-Level System Diagram

```
Chrome 插件 (WXT)                      OpenClaw Gateway
    │                                         │
    │  POST /api/chess-coach                  │
    │─────────────────────────────────────────▶│
    │                                          │
    │◀─────────────────────────────────────────│
    │  { success, data, requestId }             │
    │                                          │
    │                                    ┌─────┴─────┐
    │                                    │  chess-   │
    │                                    │orchestrator│
    │                                    │ (总管)    │
    │                                    └─────┬─────┘
    │                                          │
    │                    ┌────────────────────┼────────────────────┐
    │                    ▼                    ▼                    ▼
    │              ┌──────────┐          ┌────────────┐       ┌─────────────┐
    │              │  chess- │          │   chess-   │       │    chess-   │
    │              │ crawler │─────────▶│  engine    │──────▶│  analyst    │
    │              └──────────┘          └──────┬─────┘       └──────┬──────┘
    │                                           │                    │
    │                                           │                    │
    │                                           │                    ▼
    │                                           │            ┌─────────────┐
    │                                           │            │    chess-   │
    │                                           │            │  reviewer   │
    │                                           │            └──────┬──────┘
    │                                           │                   │
    │                                           │                   │
    │                                           │                   ▼
    │                                           │            ┌─────────────┐
    │                                           │            │    chess-   │
    │                                           │            │gamification │
    │                                           │            └─────────────┘
    └───────────────────────────────────────────┴─────────────────────┘
```

### Agent 分工

| Agent | 职责 | 入口 |
|-------|------|------|
| `chess-orchestrator` | 对外 API 入口，调度内部 Agent | ✅ 核心入口 |
| `chess-crawler` | chess.com 对局抓取 | 被 orchestrator 调用 |
| `chess-engine` | Stockfish 漏着/妙着分析 | 被 orchestrator 调用 |
| `chess-analyst` | AI 深度复盘分析（失误讲解、教学建议） | 被 orchestrator 调用 |
| `chess-reviewer` | LLM 生成趣味复盘卡片 | 被 orchestrator 调用 |
| `chess-gamification` | XP/称号/成就/雷达图系统 | 被 orchestrator 调用 |

### Action 路由

| action | 说明 | 链路 |
|--------|------|------|
| `analyze` | 分析 PGN | chess-engine → chess-analyst |
| `crawl_user` | 抓取用户历史 | chess-crawler |
| `full_review` | 完整复盘 | chess-engine → chess-analyst → chess-reviewer → chess-gamification |

---

## API Design

### Internal API (Extension Components)

#### BackgroundScript API

```typescript
// 右键菜单点击处理
interface ContextMenuHandler {
  onAnalyzeClick(info: MenuItemInfo, tab: Tab): Promise<void>;
}

// 消息传递接口
interface MessageAPI {
  // ContentScript -> Background
  'GET_PGN': () => Promise<{ pgn: string; analysis: AnalysisData }>;

  // Background -> ReactApp
  'ANALYSIS_RESULT': { pgn: string; analysis: AnalysisData };
  'ANALYSIS_ERROR': { error: string };
}
```

#### React App Internal API

```typescript
// 分析流程状态机
type ReviewState =
  | 'idle'
  | 'loading'
  | 'analyzing'
  | 'presenting'
  | 'complete';

// 核心服务
interface ReviewService {
  startReview(pgn: string): Promise<ReviewResult>;
  getGameHistory(username: string): Promise<Game[]>;
}
```

### External API (chess-orchestrator)

**入口**: `POST /api/chess-coach`

```json
// 请求格式
{
  "action": "analyze" | "crawl_user" | "full_review",
  "pgn": "1.e4 e5 2.Nf3 Nc6",
  "userId": "xxx",
  "username": "ChessKid"
}

// 响应格式
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

---

## Technical Decisions Summary

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **框架** | WXT | 自动处理 manifest/Service Worker，HMR 支持，开发体验好 |
| **React 架构** | 独立标签页 | 更好的隔离性，复杂的 UI 交互 |
| **PGN 解析** | chess.js | 成熟的库，社区支持 |
| **Multi-Agent** | OpenClaw | 模块化 Agent 协作，易扩展 |
| **LLM 集成** | chess-reviewer Agent | 统一的趣味评语生成 |
| **游戏化** | chess-gamification Agent | XP/称号/成就/雷达图 |
| **存储** | chrome.storage.local | MV3 推荐，比 localStorage 更安全 |
| **构建** | WXT 内置 | 自动生成 manifest，零配置 |

---

## Implementation Status

| 组件 | 状态 |
|------|------|
| WXT 脚手架 + UI | ✅ 完成 |
| Mock API Server | ✅ 完成 |
| Agent SKILL.md | ✅ 完成 |
| 端到端 Mock 跑通 | ✅ 完成 |
| chess-orchestrator (真实 OpenClaw) | ⏳ 待实现 |
| 真实 chess.com API | ⏳ 待接入 |
| Stockfish WASM 引擎 | ⏳ 待集成 |

---

## Next Steps

1. **chess-orchestrator Agent**: 实现真实 OpenClaw 集成
2. **插件安装测试**: 验证 WXT 构建 + 本地加载
3. **真实 API 接入**: chess.com 认证/token
4. **Stockfish 集成**: WASM 引擎对接

---

*版本：v2.2 | 更新：2026-04-04*
