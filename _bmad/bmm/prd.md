---
stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish", "step-12-complete"]
inputDocuments: ["/Users/leiw/Projects/tutorials/chess-master/_bmad/bmm/product-brief-chess-review-assistant-2026-03-31.md"]
workflowType: 'prd'
classification:
  projectType: Chrome Extension (WXT + OpenClaw)
  domain: Education / Gaming (Chess Learning)
  complexity: Medium
  projectContext: Existing (v2.2)
visionSummary:
  coreInsight: "游戏化复盘" - XP 经验值、称号成就、雷达图让复盘变得有趣
  differentiator: 一键分析 + 游戏化激励 + AI 趣味评语
  userDelight: 复盘不再枯燥，每一局都有收获感
---

# Product Requirements Document - Chess Coach

**Author:** leiw
**Date:** 2026-04-04 (v2.2)

## Executive Summary

**Chess Coach** 是一款 Chrome 插件产品，面向 14 岁 chess.com 用户（ELO 800-1000）。核心价值：**"游戏化复盘"** — 通过 XP 经验值、称号成就、雷达图能力分析，让复盘变得像玩游戏一样有趣，每一局都有收获感。

**目标用户痛点：**
- 现有分析工具输出结果枯燥，用户不愿意做复盘
- 同样的错误反复出现，棋力停滞
- 复盘没有正反馈，像做作业一样痛苦

**解决方案：**
1. **一键分析** — 右键点击"复盘"，无需复制粘贴
2. **AI 趣味评语** — 符合青少年口吻的解说，不是死板的术语
3. **游戏化激励** — XP 增长、称号解锁、雷达图展示进步

---

### What Makes This Special

- **游戏化体验** — XP、称号、成就让复盘变得有趣
- **一键启动** — 右键即分析，无需手动操作
- **AI 趣味评语** — 14岁孩子能理解的语言，充满正能量
- **雷达图分析** — 直观展示能力短板，明确进步方向

---

### Project Classification

| 维度 | 分类 |
|------|------|
| **Project Type** | Chrome Extension (WXT + OpenClaw) |
| **Domain** | Education / Gaming (Chess Learning) |
| **Complexity** | Medium — 涉及 WXT 插件、OpenClaw Agent 系统 |
| **Project Context** | Existing — v2.2 阶段 |

**技术栈：**
- 前端：React + TypeScript (WXT Chrome Extension)
- API 网关：chess-orchestrator (OpenClaw)
- Multi-Agent：crawler / engine / analyst / reviewer / gamification
- 棋谱解析：chess.js
- 引擎分析：Stockfish WASM

---

## Success Criteria

### User Success

| 指标 | 定义 | 测量方式 |
|------|------|----------|
| 棋力提升 | ELO 分数上涨 | chess.com ELO 变化 |
| 知识获取 | 能说出自己学到了什么 | 复盘完成后的评语理解度 |
| 行为改变 | 不再犯同样的错误 | 同类失误重复率下降 |

**用户重复使用阶段：**
- 初期：输了棋后想到用产品（失败触发）
- 后期：每局结束后都用（习惯养成）

**用户推荐意愿：**
- NPS > 50%（"你会推荐给朋友吗？"打分 9-10）
- 朋友间自发分享

---

### Business Success

**MVP 验证阶段（0-3个月）：**
| 目标 | 指标 |
|------|------|
| 用户参与度 | 周活跃用户 > 100 |
| 复盘完成率 | > 60% 用户完成分析 |
| 留存率 | 30天后留存 > 30% |
| 口碑传播 | > 20% 用户通过朋友推荐来 |

**增长阶段（3-12个月）：**
| 目标 | 指标 |
|------|------|
| 用户增长 | 月活跃用户 > 1000 |
| 使用深度 | 每用户平均复盘 > 2局/周 |

---

### Technical Success

| KPI | 目标值 | 测量频率 |
|-----|--------|----------|
| 插件安装量 | 500+ | 每周 |
| 复盘使用率 | > 60% 完成分析 | 每周 |
| 用户满意度 | > 4.0/5.0 | 每月 |

**领先指标：**
- 首次使用后 7 天回访率 → 产品粘性早期信号
- XP 获取频率 → 用户参与深度
- 新称号解锁率 → 成就感受到

---

## Product Scope

### MVP - Minimum Viable Product

| 功能 | 描述 | 优先级 |
|------|------|--------|
| Chrome 插件壳 | 右键菜单 + 新标签页展示 | P0 |
| 一键分析 | PGN 提取 + Stockfish 分析 | P0 |
| AI 趣味评语 | chess-reviewer 生成儿童友好语言 | P0 |
| 游戏化系统 | XP/称号/成就/雷达图 | P0 |
| Mock API Server | 开发和测试用 | P0 |

---

### Growth Features (Post-MVP)

| 方向 | 功能点 |
|------|--------|
| 分析增强 | 自部署 Stockfish 提升分析精度 |
| 离线支持 | Service Worker + 本地缓存 |
| 进度追踪 | 记录多局复盘，趋势分析 |
| 社区功能 | 分享复盘成果给朋友 |

---

## Chrome Extension Specific Requirements

### Manifest & Architecture

| 选择 | 决策 |
|------|------|
| **Manifest 版本** | MV3（WXT 自动生成） |
| **部署方式** | 开发者模式本地加载测试 |

### Extension Components

| 组件 | 职责 | 技术 |
|------|------|------|
| Content Script | 注入 chess.com 页面，提取 PGN | TypeScript |
| Background Script | 右键菜单、消息传递 | TypeScript |
| Popup/新标签页 | React 应用，展示复盘卡片 | React + TypeScript |

### Required Chrome Permissions

| 权限 | 用途 |
|------|------|
| `activeTab` | 访问当前 tab 的棋局数据 |
| `contextMenus` | 右键菜单 |
| `storage` | 本地存储用户数据 |

---

## Functional Requirements

### Chrome 插件 UI

- FR1: 用户可以在 chess.com 已完成对局页面通过右键菜单启动复盘
- FR2: 复盘结果在游戏化卡片中展示（XP、称号、评语）
- FR3: 系统可以显示加载进度状态

### API 网关

- FR4: chess-orchestrator 接收 HTTP 请求并路由到对应 Agent
- FR5: 支持 `analyze` / `crawl_user` / `full_review` 三种 action

### 棋局分析

- FR6: 系统可以解析 PGN 棋谱
- FR7: 系统可以使用 Stockfish 引擎分析漏着/妙着
- FR8: 系统可以识别 Top N 提升点
- FR9: 系统可以为每个失误点提供最佳走法建议

### LLM 解释

- FR10: 系统可以使用 chess-reviewer Agent 生成趣味评语
- FR11: 评语使用 14 岁用户能理解的术语

### 游戏化系统

- FR12: 用户可以获得 XP 经验值
- FR13: 用户可以解锁称号
- FR14: 用户可以查看雷达图能力分析
- FR15: 用户可以解锁成就

---

## Non-Functional Requirements

### Performance

- **响应时间**: 用户点击右键菜单到看到复盘页面 < 3秒
- **分析生成**: 从 PGN 提取到结果展示 < 10秒（网络正常情况下）
- **LLM 生成**: 趣味评语生成 < 5秒

### Accessibility

- **基础可访问**: 符合 WCAG 2.1 AA 基本要求
- **字体大小**: 支持浏览器缩放，不影响阅读
- **键盘导航**: 主要操作可通过键盘完成

### Integration

- **chess.com 兼容性**: 支持当前版本 chess.com 页面结构
- **OpenClaw Agent**: 支持 Agent 系统错误处理和重试
- **离线检测**: 网络断开时给出友好提示

---

## 技术栈 (当前实现)

| 层级 | 技术 |
|------|------|
| Chrome 插件框架 | WXT (MV3) |
| API 网关 | chess-orchestrator |
| Multi-Agent 系统 | OpenClaw |
| 棋谱解析 | chess.js |
| 引擎分析 | Stockfish WASM |
| 数据存储 | chrome.storage.local |

---

*版本：v2.2 | 更新：2026-04-04*
