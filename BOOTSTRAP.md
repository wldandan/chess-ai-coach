# Chess Coach - AI 国际象棋复盘 Chrome 插件

## 项目目标

为 14 岁孩子提供有趣的 chess.com 对局复盘体验，游戏化 XP + 成就系统。

## 命名

- **Chess Coach**: Chrome 插件项目名
- **chess-***: 所有 Agent 统一前缀

## 技术栈

- **入口**: Chrome 插件 (WXT 框架)
- **API 网关**: chess-orchestrator (总管 Agent)
- **分析服务**: OpenClaw Multi-Agent
- **AI 复盘**: chess-analyst Agent (深度分析 + 教学建议)
- **棋谱解析**: chess.js
- **引擎分析**: Stockfish WASM
- **游戏化**: chess-gamification Agent
- **LLM 评语**: chess-reviewer Agent
- **数据存储**: chrome.storage.local

## Agent 分工

| Agent | 职责 | 状态 |
|-------|------|------|
| `chess-orchestrator` | 对外 API 入口，调度内部 Agent | ✅ SKILL.md 完成 |
| `chess-crawler` | chess.com 对局抓取 | ✅ 完成 |
| `chess-engine` | Stockfish 漏着/妙着分析 | ✅ 完成 |
| `chess-analyst` | AI 深度复盘分析（失误讲解、教学建议） | ✅ 完成 |
| `chess-reviewer` | LLM 生成趣味复盘卡片 | ✅ 完成 |
| `chess-gamification` | XP/称号/成就/雷达图系统 | ✅ 完成 |

## Skills

- chrome-extension-wxt
- chrome-extension-ui
- browser-automation
- gamification-loops

## API

- **端点**: `POST /api/chess-coach`
- **Mock Server**: `npm run api` (port 3000)

### Actions

| action | 说明 | 链路 |
|--------|------|------|
| `analyze` | 分析 PGN | chess-engine → chess-analyst |
| `crawl_user` | 抓取用户历史 | chess-crawler |
| `full_review` | 完整复盘 | chess-engine → chess-analyst → chess-reviewer → chess-gamification |

## 进度

- [x] 2026-03-31: 项目初始化，方案设计
- [x] 2026-03-31: WXT 脚手架搭建 + Chrome 插件 UI
- [x] 2026-03-31: chess.com 抓取 Agent (chess-crawler)
- [x] 2026-03-31: Stockfish 分析 Agent (chess-engine)
- [x] 2026-03-31: 复盘生成 Agent (chess-reviewer)
- [x] 2026-03-31: 游戏化系统 (chess-gamification)
- [x] 2026-03-31: 端到端 Mock 数据跑通
- [x] 2026-04-04: 项目重命名为 chess-coach
- [x] 2026-04-04: Agent 统一命名 (chess.* 前缀)
- [x] 2026-04-04: Mock API Server 实现
- [x] 2026-04-04: chess-orchestrator 设计文档
- [ ] 待实现: chess-orchestrator Agent (真实 OpenClaw 集成)
- [ ] 待验证: 插件安装测试
- [ ] 待接入: 真实 chess.com API (需要认证/token)
- [ ] 待集成: Stockfish WASM 真实引擎

---

*版本：v2.2 | 更新：2026-04-04*
