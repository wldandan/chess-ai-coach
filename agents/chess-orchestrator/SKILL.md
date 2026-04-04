# Chess Orchestrator Agent

## 职责

**chess-orchestrator** 是 Chess Coach 系统的**对外统一入口**，负责接收外部 HTTP 请求并调度内部 Agent。

## 核心能力

### 1. API 路由 (route-action)
根据 `action` 参数分发请求到对应 Agent：
- `analyze` → chess-engine + chess-analyst + chess-reviewer
- `crawl_user` → chess-crawler
- `full_review` → 完整链路

### 2. Agent 编排 (orchestrate)
协调多个 Agent 的调用顺序，收集结果，聚合响应。

### 3. 错误处理 (error-handling)
- 单个 Agent 失败不影响其他 Agent
- 超时处理
- 返回统一错误格式

## HTTP 接口

**端点**: `POST /api/chess-coach`

### 请求格式

```typescript
interface ChessCoachRequest {
  action: 'analyze' | 'crawl_user' | 'full_review';
  pgn?: string;
  username?: string;
  userId?: string;
  limit?: number;
}
```

### 响应格式

```typescript
interface ChessCoachResponse {
  success: boolean;
  data?: {
    gameId: string;
    gameInfo: GameInfo;
    analysis: Analysis;
    review: Review;
    gamification: Gamification;
    chessAnalyst: ChessAnalystResult;
  };
  error?: string;
  requestId: string;
}
```

## Action 路由表

| Action | 调度链路 | 输出 |
|--------|---------|------|
| `analyze` | chess-engine → chess-analyst | accuracy, blunders, brilliants, phaseScores |
| `crawl_user` | chess-crawler | username, games[] |
| `full_review` | chess-engine → chess-analyst → chess-reviewer → chess-gamification | 完整复盘卡片 |

## 编排流程

### full_review 流程

```
请求进入
    │
    ▼
┌─────────────────────────────┐
│  1. chess-engine.analyze   │
│     输入: pgn              │
│     输出: accuracy, blunders│
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  2. chess-analyst.review    │
│     输入: pgn + analysis    │
│     输出: summary, mistakes │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  3. chess-reviewer.generate │
│     输入: analysis + profile │
│     输出: markdown, html    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  4. chess-gamification.update│
│     输入: review result     │
│     输出: xpGained, titles  │
└─────────────┬───────────────┘
              │
              ▼
        聚合响应
```

## 错误处理

```typescript
// 错误响应格式
{
  success: false,
  error: "chess-engine timeout after 30s",
  requestId: "req_xxx"
}

// 单个 Agent 失败不影响其他
// 超时: 30s per Agent
// 重试: 不自动重试，由调用方决定
```

## 实现状态

- [x] Mock API Server (开发测试用)
- [ ] chess-orchestrator Agent (待实现)
- [ ] 真实 OpenClaw 集成

---

*版本：v1.0 | 创建：2026-04-04*
