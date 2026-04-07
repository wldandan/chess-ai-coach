# Story 1.1: Chrome Extension 项目初始化

Status: ready-for-dev

## Story

As a **Developer**,
I want **验证 WXT 脚手架正常运行，配置 TypeScript 和 React，验证 popup 页面加载**,
so that **为后续开发建立稳定的基础**。

## Acceptance Criteria

1. [ ] `npm run dev` 可以在 chrome-extension 目录启动 WXT 开发服务器
2. [ ] TypeScript 配置正确，无编译错误
3. [ ] React 组件可以正常渲染
4. [ ] popup 页面可以在浏览器中加载
5. [ ] `npm run build` 可以成功构建生产版本

## Tasks / Subtasks

- [ ] Task 1: 验证开发环境 (AC: #1)
  - [ ] 1.1 检查 node_modules 已安装
  - [ ] 1.2 运行 `npm run dev` 验证服务启动
  - [ ] 1.3 验证无 TypeScript 错误
- [ ] Task 2: 验证 popup 页面加载 (AC: #3, #4)
  - [ ] 2.1 检查 App.tsx 可以渲染
  - [ ] 2.2 检查 main.tsx 入口正确
  - [ ] 2.3 验证 popup/index.html 存在
- [ ] Task 3: 验证构建流程 (AC: #5)
  - [ ] 3.1 运行 `npm run build`
  - [ ] 3.2 检查 output 目录生成

## Dev Notes

### 项目结构

```
chrome-extension/
├── entrypoints/
│   ├── popup/           # popup UI (React)
│   ├── options/         # 选项页面
│   ├── content/         # Content Script
│   └── details/          # 详情页
├── src/                  # 共享代码
│   ├── gamification/    # 游戏化模块
│   └── shared/         # 共享类型
├── .wxt/                 # WXT 配置
├── wxt.config.ts        # WXT 入口配置
└── package.json
```

### 技术栈

- **Chrome 插件框架**: WXT (MV3)
- **UI**: React 19 + TypeScript
- **构建**: WXT 内置

### 验证标准

- 开发服务器应在 `npm run dev` 后无错误启动
- TypeScript 编译应无错误
- popup.html 应可访问

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

### Completion Notes List

### File List

- `chrome-extension/package.json`
- `chrome-extension/wxt.config.ts`
- `chrome-extension/entrypoints/popup/main.tsx`
- `chrome-extension/entrypoints/popup/App.tsx`
