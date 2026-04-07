import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  // Directory configuration
  entrypointsDir: 'entrypoints',

  // Use same output dir for both dev and build
  outDir: 'output',

  manifest: {
    name: '🏆 Chess Coach - AI 复盘助手',
    description: 'AI 国际象棋复盘工具，为 14 岁青少年打造的游戏化学习体验',
    version: '0.1.0',
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
    host_permissions: [
      '*://*.chess.com/*',
      '*://chess.com/*',
    ],
    action: {
      default_popup: 'popup/index.html',
    },
    options_page: 'options/index.html',
  },

  // Aliases
  alias: {
    '@': '/src',
    '@popup': '/entrypoints/popup',
    '@components': '/components',
  },
});
