# Chess Coach - 系统架构

## Monorepo 结构

```
chess-ai-coach/
│
├── chrome-extension/           # Chrome 插件
│   ├── entrypoints/            #   popup, options, content, details
│   ├── src/                    #   gamification, shared
│   ├── public/                 #   静态资源
│   ├── .wxt/                   #   WXT 配置
│   ├── wxt.config.ts           #   WXT 入口配置
│   └── package.json            #   插件依赖
│
├── api-server/                  # API 服务
│   ├── src/
│   │   ├── gateway.ts         #   HTTP 网关（唯一入口）
│   │   └── mock-*.json        #   Mock 数据
│   ├── package.json
│   └── tsconfig.json
│
└── agents/                     # Agent SKILL.md 定义
    ├── chess-orchestrator/     #   编排 Agent
    ├── chess-engine/           #   引擎分析 Agent
    ├── chess-analyst/          #   AI 复盘分析 Agent
    ├── chess-crawler/          #   棋谱抓取 Agent
    ├── chess-reviewer/         #   趣味评语 Agent
    ├── chess-gamification/     #   游戏化 Agent
    └── opencode-chess-skill/  #   OpenCode 专用 Skill
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
│                          (api-server/src/gateway.ts)                           │
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

## 组件职责

| 组件 | 目录 | 职责 |
|------|------|------|
| Chrome Extension | `chrome-extension/` | 插件 UI（popup, content script） |
| API Gateway | `api-server/src/gateway.ts` | HTTP 入口，路由到 OpenClaw/OpenCode |
| Agents | `agents/*.SKILL.md` | Agent 能力定义（OpenClaw/OpenCode 运行时读取） |

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

## 安全建议

1. **Gateway** 对外暴露，**OpenClaw** 只监听 localhost
2. 使用 `Authorization: Bearer <API_KEY>` 认证
3. 生产环境建议加一层 Nginx 做 SSL 终止

---

*版本：v5.0 | 更新：2026-04-06*
