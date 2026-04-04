import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  
  manifest: {
    name: '🏆 Chess Coach - AI 复盘助手',
    description: 'AI 国际象棋复盘工具，为 14 岁青少年打造的游戏化学习体验',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: [
      '*://*.chess.com/*',
      '*://chess.com/*',
    ],
    action: {
      default_popup: 'popup/index.html',
    },
  },

  // Dev server config
  devServer: {
    restartOnEntrypointChanges: true,
  },

  // Aliases
  alias: {
    '@': '/src',
    '@popup': '/entrypoints/popup',
    '@components': '/components',
  },
});
