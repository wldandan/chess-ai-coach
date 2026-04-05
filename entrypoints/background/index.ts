// Background Script - Service Worker
// 处理右键菜单、消息传递、API 调用中转

import type { ChromeMessage, UserConfig } from '../../src/shared/types';

interface PgnData {
  pgn: string;
  evaluations?: Array<{
    moveNumber: number;
    san: string;
    evaluation?: number;
    isMistake?: boolean;
    isBlunder?: boolean;
  }>;
  url?: string;
  gameId?: string;
  source?: 'api' | 'dom';
}

const CONFIG_KEY = 'chess_coach_config';

// ============== 配置管理 ==============

async function getConfig(): Promise<UserConfig> {
  const result = await browser.storage.local.get(CONFIG_KEY);
  return result[CONFIG_KEY] || { username: '', analysisMode: 'chess-com', apiKey: '' };
}

async function saveConfig(config: UserConfig): Promise<void> {
  await browser.storage.local.set({ [CONFIG_KEY]: config });
}

// ============== 右键菜单 ==============

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'analyzeGame',
    title: '复盘这盘棋 🏰',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://www.chess.com/*',
      'https://lichess.org/*',
    ],
  });
  console.log('[Chess Coach] Context menu created');
});

// ============== 右键菜单点击处理 ==============

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'analyzeGame' && tab?.id) {
    console.log('[Chess Coach] Analyze menu clicked');

    const url = tab.url || '';
    const gameIdMatch = url.match(/\/game\/\w+\/(\d+)/);

    if (!gameIdMatch) {
      console.error('[Chess Coach] No game ID found in URL');
      return;
    }

    const gameId = gameIdMatch[1];
    const config = await getConfig();

    if (!config.username) {
      console.error('[Chess Coach] No username configured');
      browser.tabs.create({
        url: browser.runtime.getURL('index.html'), // 打开 popup 引导设置
      });
      return;
    }

    let pgnData: PgnData | null = null;

    // 优先尝试 DOM 方式获取
    console.log('[Chess Coach] Trying DOM extraction...');
    pgnData = await fetchPGNFromDOM(tab.id, gameId);

    // 如果 DOM 方式失败，跳转到分析页面
    if (!pgnData && !url.includes('/analysis/')) {
      console.log('[Chess Coach] DOM extraction failed, navigating to analysis page...');
      const analysisUrl = url.replace(/\/game\/(\w+)\/(\d+).*/, '/game/$1/$2/analysis');
      await browser.tabs.update(tab.id, { url: analysisUrl });
      await waitForTabLoad(tab.id);
      pgnData = await fetchPGNFromDOM(tab.id, gameId);
    }

    // 如果分析页面 DOM 也失败，使用 API
    if (!pgnData) {
      console.log('[Chess Coach] Falling back to API');
      pgnData = await fetchPGNFromAPI(gameId, config.username);
    }

    if (pgnData) {
      await handlePgnReady(pgnData);
    } else {
      console.error('[Chess Coach] Failed to get PGN from all sources');
    }
  }
});

// ============== 消息监听 ==============

browser.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
  console.log('[Chess Coach] Background received message:', message.type);

  switch (message.type) {
    case 'START_REVIEW':
      (async () => {
        const gameId = message.gameId as string;
        const config = await getConfig();

        if (!config.username) {
          sendResponse({ success: false, error: '请先配置用户名' });
          return;
        }

        const pgnData = await fetchPGNFromAPI(gameId, config.username);
        if (pgnData) {
          await handlePgnReady(pgnData);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: '无法获取对局数据' });
        }
      })();
      break;

    case 'GET_CONFIG':
      getConfig().then(config => sendResponse({ success: true, data: config }));
      break;

    case 'SAVE_CONFIG':
      if (message.payload) {
        saveConfig(message.payload as UserConfig).then(() =>
          sendResponse({ success: true })
        );
      }
      break;

    case 'ANALYSIS_RESULT':
      console.log('[Chess Coach] Analysis complete');
      sendResponse({ success: true });
      break;

    case 'ERROR':
      console.error('[Chess Coach] Error:', message.payload);
      sendResponse({ success: false, error: message.payload });
      break;

    default:
      sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
  }

  return true; // 保持通道开放
});

// ============== PGN 获取方法 ==============

async function fetchPGNFromDOM(tabId: number, gameId: string): Promise<PgnData | null> {
  console.log('[Chess Coach] Fetching PGN from DOM for game:', gameId);

  try {
    const tab = await browser.tabs.get(tabId);
    console.log('[Chess Coach] Tab URL:', tab.url, 'status:', tab.status);

    if (tab.status !== 'complete') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const response = await browser.tabs.sendMessage(tabId, { type: 'GET_GAME', gameId });
    console.log('[Chess Coach] DOM response:', response);

    if (response && response.pgn) {
      return {
        pgn: response.pgn,
        url: response.url,
        gameId: gameId,
        source: 'dom',
      };
    }
    return null;
  } catch (error) {
    console.error('[Chess Coach] Failed to fetch from DOM:', error);
    return null;
  }
}

async function fetchPGNFromAPI(gameId: string, username: string): Promise<PgnData | null> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthsToTry = [
      { year, month },
      { year: month === 1 ? year - 1 : year, month: month === 1 ? 12 : month - 1 },
      { year: month <= 2 ? year - 1 : year, month: month <= 2 ? 12 + (month - 2) : month - 2 },
    ];

    console.log('[Chess Coach] Searching for game:', gameId, 'for user:', username);

    for (const { year: y, month: m } of monthsToTry) {
      const monthStr = String(m).padStart(2, '0');
      const apiUrl = `https://api.chess.com/pub/player/${username}/games/${y}/${monthStr}`;
      console.log('[Chess Coach] Trying:', apiUrl);

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) continue;

        const data = await response.json();
        const games = data.games || [];
        const targetGame = games.find((g: { url?: string }) => g.url && g.url.includes(gameId));

        if (targetGame) {
          console.log('[Chess Coach] Found game via API!');
          return {
            pgn: targetGame.pgn,
            url: targetGame.url,
            gameId: gameId,
            source: 'api',
          };
        }
      } catch (e) {
        console.log('[Chess Coach] Fetch failed:', e);
      }
    }

    console.error('[Chess Coach] Game not found in last 3 months');
    return null;
  } catch (error) {
    console.error('[Chess Coach] Failed to fetch PGN:', error);
    return null;
  }
}

async function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log('[Chess Coach] Tab load timeout');
      resolve();
    }, 5000);

    browser.tabs.onUpdated.addListener(function listener(tabIdListener, changeInfo) {
      if (tabIdListener === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        browser.tabs.onUpdated.removeListener(listener);
        console.log('[Chess Coach] Tab load complete');
        resolve();
      }
    });
  });
}

// ============== 处理 PGN 数据 ==============

async function handlePgnReady(pgnData: PgnData): Promise<void> {
  try {
    // 存储到 session 以便跨页面传递
    await browser.storage.session.set({ pendingGameData: pgnData });
    console.log('[Chess Coach] PGN data stored in session storage');

    // 打开 popup（用户可以在 popup 中看到分析结果）
    // 或者打开新的分析标签页
    const popupUrl = browser.runtime.getURL('index.html');
    await browser.tabs.create({
      url: popupUrl,
      active: true,
    });

    console.log('[Chess Coach] Opened popup');
  } catch (error) {
    console.error('[Chess Coach] Failed to open popup:', error);
  }
}

// ============== 保持 Service Worker 活跃 ==============

browser.runtime.onConnect.addListener((port) => {
  console.log('[Chess Coach] Connected to:', port.name);
});

console.log('[Chess Coach] Background service worker started');
