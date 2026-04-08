# ♟️ Chess AI Coach - AI 国际象棋复盘 Chrome 插件

> 给 14 岁孩子的趣味国际象棋复盘工具 🏆⭐🎮

## 功能特色

- 🎯 **智能复盘** - 一键分析 chess.com 对局，发现漏着与妙着
- 🏆 **游戏化系统** - XP 经验值、称号成就、雷达图能力分析
- 💬 **趣味评语** - AI 生成符合青少年口吻的复盘解说
- ⚡ **快速响应** - 插件即点即用，无需切换页面

## 使用指南

### 1. 安装插件

1. 下载本项目
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角 **Developer mode**
4. 点击 **Load unpacked**
5. 选择项目中的 `chrome-extension/output/chrome-mv3/` 文件夹

### 2. 配置插件

1. 点击插件图标，打开设置页面
2. 输入你的 **chess.com 用户名**
3. 选择分析模式：
   - **chess.com 分析数据**（推荐）：使用 chess.com 自带的评估
   - **本地规则分析**：使用预设规则检测常见错误
   - **AI 智能分析**：使用 LLM 生成个性化分析（需要 API Key）

### 3. 分析棋局

1. 打开 chess.com 的任意棋局页面
2. 点击浏览器右上角的 **Chess Coach** 插件图标
3. 点击 **分析棋局** 按钮
4. 等待分析完成，查看复盘结果

### 4. 查看复盘结果

复盘卡片包含：
- 📊 **准确率** - 整体表现评分
- ⭐ **经验值** - 本局获得的经验
- ✨ **妙着** - 精彩的好棋
- 🟡 **漏着** - 失误的着法
- 🔴 **大失误** - 严重错误

点击 **查看明细** 可查看详细的改进建议。

### 5. 演示模式

如果没有打开 chess.com 页面，可以点击 **演示模式** 查看示例结果。

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

## 如何测试

### 自动测试（推荐）

```bash
cd chrome-extension

# 运行所有测试（headless）
npm test

# 运行测试并打开 UI
npm run test:ui

# 运行测试并显示浏览器
npm run test:headed
```

### 测试类型

| 测试类型 | 位置 | 说明 |
|---------|------|------|
| PGN Extraction | `tests/fixtures/pgn-extraction.spec.ts` | PGN 提取逻辑测试 |
| Mock Server API | `tests/mock-server.spec.ts` | API 端点测试 |
| Build Output | `tests/popup.spec.ts` | 构建产物验证 |
| chess.com E2E | `tests/e2e/chesscom.spec.ts` | 真实页面测试 |

### E2E 测试（真实 chess.com）

E2E 测试需要 chess.com 账号：

```bash
# 1. 创建环境变量文件
cp tests/e2e/.env.example tests/e2e/.env

# 2. 编辑 .env，填入账号密码
# CHESS_COM_USER=your_username
# CHESS_COM_PASSWORD=your_password
# CHESS_COM_GAME_ID=123456789  # 可选

# 3. 运行 E2E 测试
npx playwright test tests/e2e/
```

⚠️ **注意**：
- `.env` 文件已加入 `.gitignore`，不会被提交
- 避免频繁测试，可能被 chess.com 限流

### 手动测试 Chrome 插件

1. **启动 Mock Server**
```bash
cd api-server
node src/mock-server.js  # 端口 18889
```

2. **启动插件开发服务器**
```bash
cd chrome-extension
npm run dev  # 打开 Chrome
```

3. **加载插件到 Chrome**
   - 打开 `chrome://extensions/`
   - 开启 **Developer mode**
   - 点击 **Load unpacked**
   - 选择 `chrome-extension/output/chrome-mv3-dev/`

4. **测试流程**
   - 打开 chess.com 棋局页面
   - 点击插件图标 → **分析棋局**
   - 查看复盘结果卡片

### 测试覆盖率

```
tests/
├── fixtures/
│   ├── chesscom-game-mock.html     # Mock chess.com 页面
│   └── pgn-extraction.spec.ts      # 5 tests  - PGN 提取测试
├── mock-server.spec.ts             # 5 tests  - API 端点测试
├── popup.spec.ts                   # 7 tests  - 构建产物验证
└── e2e/
    ├── chesscom.spec.ts            # 2 tests  - E2E 测试
    └── .env.example               # 环境变量模板
```

**总计：17 tests 全部通过**

### PGN 提取方法支持

| 方法 | Source | 状态 |
|------|--------|------|
| `data-pgn` | `<div data-pgn="...">` | ✅ |
| `meta` tag | `<meta name="pgn" content="...">` | ✅ |
| `window.pgnData` | `var pgnData = {pgn: "..."}` | ✅ |
| `window.__NUXT__` | Nuxt SSR data | ✅ |

---

## Tech Stack

- **Chrome 插件**: WXT 框架 (MV3)
- **API 网关**: gateway.ts (TypeScript)
- **Multi-Agent**: OpenClaw / OpenCode
- **Agent 定义**: SKILL.md
- **棋谱解析**: chess.js
- **引擎分析**: Stockfish WASM
- **UI**: React + 游戏化风格卡片

---

*版本：v0.5.0 | 更新：2026-04-08*
