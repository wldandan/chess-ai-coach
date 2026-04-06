---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
workflowType: 'architecture'
classification:
  projectType: Chrome Extension (WXT + OpenClaw/OpenCode)
  domain: Education / Gaming (Chess Learning)
  complexity: Medium
  projectContext: Existing (v5.0)
---

# Architecture Decision Document - Chess Coach

_This document reflects the current Chess Coach v5.0 implementation._

## Project Context

### Directory Structure

```
chess-ai-coach/
│
├── chrome-extension/           # Chrome 插件
│   ├── entrypoints/          #   popup, options, content, details
│   ├── src/                  #   gamification, shared
│   ├── .wxt/                #   WXT 配置
│   └── package.json
│
├── api-server/               # API 服务
│   ├── src/
│   │   └── gateway.ts       #   HTTP 网关（唯一入口）
│   └── package.json
│
└── agents/                  # Agent SKILL.md 定义
    ├── chess-orchestrator/
    ├── chess-engine/
    ├── chess-analyst/
    ├── chess-crawler/
    ├── chess-reviewer/
    └── chess-gamification/
```

### Requirements Overview

**Functional Requirements:**
- **Chrome 插件 UI** (3个): 右键菜单、popup 展示、游戏化复盘卡片
- **API 网关** (1个): Gateway 统一入口，路由到 OpenClaw/OpenCode
- **棋局分析** (4个): PGN 解析、Stockfish 引擎分析、漏着/妙着识别、最佳走法建议
- **LLM 解释** (2个): 趣味评语生成、儿童友好语言
- **游戏化系统** (4个): XP 经验值、称号成就、雷达图能力分析

**Non-Functional Requirements:**
- 性能：插件即点即用，分析响应 < 10秒
- 可访问性：WCAG 2.1 AA 基础标准
- 集成：chess.com 页面兼容、OpenClaw/OpenCode Agent 系统

### Technical Stack

| 层级 | 技术 |
|------|------|
| Chrome 插件框架 | WXT (MV3) |
| API 网关 | gateway.ts (TypeScript) |
| Multi-Agent 系统 | OpenClaw / OpenCode |
| Agent 定义 | SKILL.md (纯定义，无实现) |
| 棋谱解析 | chess.js |
| 引擎分析 | Stockfish WASM |
| 数据存储 | chrome.storage.local |

---

## Component Architecture

### High-Level System Diagram

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

### Component Responsibilities

| 组件 | 目录 | 职责 |
|------|------|------|
| Chrome Extension | `chrome-extension/` | 插件 UI（popup, content script） |
| API Gateway | `api-server/src/gateway.ts` | **独立实现**：HTTP 入口，棋局分析逻辑 |
| OpenClaw/OpenCode | 外部运行时 | 读取 `agents/*.SKILL.md` 并执行 Agent 逻辑 |

### Agent 定义 (SKILL.md only)

| Agent | 职责 | 文件 |
|-------|------|------|
| `chess-orchestrator` | 编排入口，调度其他 Agent | SKILL.md |
| `chess-engine` | Stockfish 漏着/妙着分析 | SKILL.md |
| `chess-analyst` | AI 深度复盘分析（失误讲解、教学建议） | SKILL.md |
| `chess-crawler` | chess.com 对局抓取 | SKILL.md |
| `chess-reviewer` | LLM 生成趣味复盘卡片 | SKILL.md |
| `chess-gamification` | XP/称号/成就/雷达图系统 | SKILL.md |

### Action 路由

| Action | OpenClaw | OpenCode |
|--------|----------|----------|
| `analyze` | ✅ | ✅ |
| `crawl_user` | ✅ | ❌ |
| `full_review` | ✅ | ❌ |

---

## API Design

### External API (Gateway)

**入口**: `POST /api/chess-coach`

```json
// 请求格式
{
  "action": "analyze" | "crawl_user" | "full_review",
  "pgn": "1.e4 e5 2.Nf3 Nc6",
  "userId": "xxx",
  "username": "ChessKid",
  "provider": "openclaw" | "opencode"
}

// 响应格式
{
  "success": true,
  "data": { ... },
  "requestId": "req_xxx",
  "provider": "openclaw"
}
```

---

## Technical Decisions Summary

| 决策点 | 选择 | 理由 |
|--------|------|------|
| **目录结构** | Monorepo (3部分) | chrome-extension / api-server / agents 分离 |
| **Agent 实现** | 纯 SKILL.md | OpenClaw/OpenCode 运行时读取，不在项目内实现 |
| **Gateway** | 单一入口 | 统一 HTTP 入口，路由到 OpenClaw 或 OpenCode |
| **框架** | WXT | 自动处理 manifest/Service Worker，HMR 支持 |
| **PGN 解析** | chess.js | 成熟的库，社区支持 |
| **Multi-Agent** | OpenClaw + OpenCode | 双路径支持，灵活切换 |
| **存储** | chrome.storage.local | MV3 推荐，比 localStorage 更安全 |

---

## Implementation Status

| 组件 | 状态 |
|------|------|
| WXT 脚手架 + UI | ✅ 完成 |
| API Gateway | ✅ 完成 |
| Agent SKILL.md | ✅ 完成 |
| 目录结构重组 (v5.0) | ✅ 完成 |
| 端到端 Mock 测试 | ⏳ 待验证 |
| 真实 OpenClaw/OpenCode 集成 | ⏳ 待接入 |
| 真实 chess.com API | ⏳ 待接入 |
| Stockfish WASM 引擎 | ⏳ 待集成 |

---

## Next Steps

1. **目录结构验证**: 确认三个部分独立可用
2. **Gateway 测试**: 验证路由到 OpenClaw/OpenCode
3. **插件安装测试**: 验证 WXT 构建 + 本地加载
4. **Agent 集成**: OpenClaw/OpenCode 运行时对接
5. **真实 API 接入**: chess.com 认证/token
6. **Stockfish 集成**: WASM 引擎对接

---

*版本：v5.0 | 更新：2026-04-06*
