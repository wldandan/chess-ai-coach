export default defineContentScript({
  matches: ['*://*.chess.com/*'],
  runAt: 'document_end',

  main(ctx) {
    console.log('[Chess Coach] Content script loaded on chess.com');

    // Listen for messages from popup/background
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'analyzeGame') {
        handleAnalyzeGame(message.username)
          .then(sendResponse)
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async
      }
    });

    // Inject floating action button on chess.com
    injectFloatingButton(ctx);
  },
});

async function handleAnalyzeGame(username: string) {
  // Get current game info from chess.com page
  const gameInfo = extractGameInfo();
  
  if (!gameInfo.pgn) {
    throw new Error('无法获取对局数据，请在打开对局后重试');
  }

  // Send to background service for Agent processing
  const response = await browser.runtime.sendMessage({
    action: 'processGameAnalysis',
    gameData: gameInfo,
    username,
  });

  return response;
}

function extractGameInfo() {
  const info: any = {
    pgn: null,
    white: null,
    black: null,
    result: null,
    timeControl: null,
    opening: null,
    url: window.location.href,
  };

  // Try to get PGN from page
  const pgnElement = document.querySelector('textarea[data-pgn], .pgn-textarea');
  if (pgnElement) {
    info.pgn = (pgnElement as HTMLTextAreaElement).value || pgnElement.textContent;
  }

  // Try to get game info from meta tags or attributes
  const gameBoard = document.querySelector('[data-game-id], .board-component');
  if (gameBoard) {
    info.gameId = gameBoard.getAttribute('data-game-id');
  }

  // Extract player names from board
  const players = document.querySelectorAll('.user-username, .player-name');
  if (players.length >= 2) {
    info.white = players[0].textContent?.trim();
    info.black = players[1].textContent?.trim();
  }

  // Extract result
  const resultEl = document.querySelector('.game-result, [class*="result"]');
  if (resultEl) {
    info.result = resultEl.textContent?.trim();
  }

  // Try to find opening name
  const openingEl = document.querySelector('[class*="opening"], .eco-name');
  if (openingEl) {
    info.opening = openingEl.textContent?.trim();
  }

  return info;
}

function injectFloatingButton(ctx: any) {
  // Check if we're on a game page
  if (!window.location.pathname.includes('/game/')) {
    return;
  }

  const button = document.createElement('div');
  button.className = 'chess-coach-fab';
  button.innerHTML = `
    <button class="fab-button" title="用 Chess Coach 分析">
      <span class="fab-icon">🏆</span>
      <span class="fab-text">AI 复盘</span>
    </button>
  `;
  button.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    z-index: 9999;
    font-family: system-ui, sans-serif;
  `;

  const shadow = button.attachShadow({ mode: 'closed' });
  shadow.innerHTML = `
    <style>
      .fab-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%);
        border: 2px solid #00f5ff;
        border-radius: 30px;
        color: white;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(0, 245, 255, 0.4), 0 4px 15px rgba(0, 0, 0, 0.5);
        transition: all 0.3s ease;
      }
      .fab-button:hover {
        transform: scale(1.05);
        box-shadow: 0 0 30px rgba(0, 245, 255, 0.6), 0 6px 20px rgba(0, 0, 0, 0.6);
      }
      .fab-icon { font-size: 18px; }
      .fab-text { color: #00f5ff; }
    </style>
  `;

  const btn = shadow.querySelector('.fab-button')!;
  btn.addEventListener('click', () => {
    // Trigger popup or send message
    browser.runtime.sendMessage({ action: 'openPopup' });
  });

  document.body.appendChild(button);
}
