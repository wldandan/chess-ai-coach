# Chess Coach - Epics

## Epic 1: Chrome Extension + Mock Server

**目标**: 实现 Chrome 插件 UI 和 Mock API 服务，完成端到端可运行版本

### Story 1.1: Chrome Extension 项目初始化

- 验证 WXT 脚手架正常运行
- 配置 TypeScript 和 React
- 验证 popup 页面加载

### Story 1.2: Content Script PGN 提取

- 从 chess.com 页面提取 PGN
- 支持 game over 页面和分析页面
- 消息传递到 popup

### Story 1.3: Popup UI 实现

- 用户名输入
- 分析按钮
- 复盘卡片展示
- 设置页面

### Story 1.4: Mock Server 实现

- 实现 `/api/chess-coach` 端点
- Mock analyze/crawl_user/full_review 响应
- 支持静态 JSON 数据返回

### Story 1.5: 端到端集成测试

- Extension → Gateway → Mock Server 完整链路
- 验证 UI 显示正确数据

---

## Epic 2: Server 调度 OpenClaw

**目标**: Gateway 支持调度 OpenClaw 运行时

### Story 2.1: Gateway OpenClaw 客户端

- 实现 WebSocket 连接管理
- 请求/响应编解码
- 错误处理和重连

### Story 2.2: Provider 路由逻辑

- 根据 `provider` 参数路由
- 支持 openclaw/opencode 切换
- 健康检查端点

### Story 2.3: OpenClaw 运行时对接

- 验证 OpenClaw 服务可用
- 测试 analyze/crawl_user/full_review 链路
- 验证 SKILL.md 加载

---

## Epic 3: OpenClaw + Skills 多 Agent

**目标**: 实现完整的多 Agent 协作系统

### Story 3.1: chess-engine Agent 实现

- Stockfish 引擎集成
- 漏着/妙着识别
- 评估计算

### Story 3.2: chess-analyst Agent 实现

- AI 深度复盘分析
- 失误讲解
- 教学建议

### Story 3.3: chess-crawler Agent 实现

- chess.com API 集成
- 用户历史对局抓取
- PGN 解析

### Story 3.4: chess-reviewer Agent 实现

- LLM 趣味评语生成
- Markdown/HTML 输出
- 儿童友好语言

### Story 3.5: chess-gamification Agent 实现

- XP 系统
- 称号解锁
- 雷达图数据

### Story 3.6: chess-orchestrator 编排

- 多 Agent 调度
- 结果聚合
- 错误处理

---

## Epic 4: 生产部署

**目标**: 准备生产环境部署

### Story 4.1: 安全加固

- API Key 管理
- CORS 配置
- Rate limiting

### Story 4.2: 性能优化

- 缓存策略
- 并发处理
- 响应时间优化

### Story 4.3: 部署文档

- 服务器要求
- 环境变量配置
- 监控告警
