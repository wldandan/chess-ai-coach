// Content Script - 注入 chess.com 页面，提取 PGN 和分析数据

import type { ChromeMessage } from '../../src/shared/types';

interface MoveEvaluation {
  moveNumber: number;
  san: string;
  evaluation?: number;
  isMistake?: boolean;
  isBlunder?: boolean;
}

interface PgnData {
  pgn: string;
  evaluations?: MoveEvaluation[];
  url: string;
  gameId?: string;
}

/**
 * 从 chess.com 提取 PGN 数据
 */
function extractFromChessCom(): PgnData | null {
  const evaluations = extractEvaluations();
  const isAnalysisPage = window.location.href.includes('/analysis/');

  if (isAnalysisPage) {
    const pgn = extractFromAnalysisPage();
    if (pgn) {
      console.log('[Chess Coach] Extracted PGN from analysis page, length:', pgn.length);
      return { pgn, evaluations, url: window.location.href, gameId: extractGameId() };
    }
  }

  // 方法1: 从嵌入式数据获取
  const scripts = Array.from(document.querySelectorAll('script'));
  for (const script of scripts) {
    const content = script.textContent || '';
    const pgnMatch = content.match(/"pgn"\s*:\s*"([^"]+)"/);
    if (pgnMatch) {
      return {
        pgn: decodeURIComponent(pgnMatch[1].replace(/\\n/g, '\n')),
        evaluations,
        url: window.location.href,
        gameId: extractGameId(),
      };
    }
  }

  // 方法2: meta 标签
  const pgnMeta = document.querySelector('meta[name="pgn"]') as HTMLMetaElement;
  if (pgnMeta?.content) {
    return {
      pgn: decodeURIComponent(pgnMeta.content),
      evaluations,
      url: window.location.href,
      gameId: extractGameId(),
    };
  }

  // 方法3: data 属性
  const boardElement = document.querySelector('[data-pgn]') as HTMLElement;
  if (boardElement?.dataset.pgn) {
    return {
      pgn: boardElement.dataset.pgn,
      evaluations,
      url: window.location.href,
      gameId: extractGameId(),
    };
  }

  // 方法4: 从页面移动列表构建
  const pgnText = extractPgnFromPage();
  if (pgnText) {
    return { pgn: pgnText, evaluations, url: window.location.href, gameId: extractGameId() };
  }

  return null;
}

/**
 * 从分析页面提取 PGN
 */
function extractFromAnalysisPage(): string | null {
  const scripts = Array.from(document.querySelectorAll('script'));
  for (const script of scripts) {
    const content = script.textContent || '';
    if (content.includes('"pgn"') || content.includes("'pgn'")) {
      const patterns = [
        /"pgn"\s*:\s*"([^"]+)"/,
        /pgn\s*:\s*'([^']+)'/,
        /pgn\s*:\s*`([^`]+)`/,
      ];
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1].length > 100) {
          try {
            const pgn = decodeURIComponent(match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
            if (pgn.includes('1. ')) return pgn;
          } catch {
            const pgn = match[1].replace(/\\n/g, '\n');
            if (pgn.includes('1. ')) return pgn;
          }
        }
      }
    }
  }

  // hidden input 或 textarea
  const hiddenPgn = document.querySelector('input[name="pgn"], textarea[name="pgn"]') as HTMLInputElement | HTMLTextAreaElement;
  if (hiddenPgn?.value && hiddenPgn.value.includes('1. ')) {
    return hiddenPgn.value;
  }

  // window.__NUXT__
  const win = window as unknown as Record<string, unknown>;
  if (win.__NUXT__ && typeof win.__NUXT__ === 'object') {
    const nuxtStr = JSON.stringify(win.__NUXT__);
    if (nuxtStr.includes('"pgn"') || nuxtStr.includes('pgn')) {
      const pgnMatch = nuxtStr.match(/"pgn"\s*:\s*"([^"]+)"/);
      if (pgnMatch) {
        try {
          return decodeURIComponent(pgnMatch[1].replace(/\\n/g, '\n'));
        } catch {
          return pgnMatch[1].replace(/\\n/g, '\n');
        }
      }
    }
  }

  return null;
}

/**
 * 提取评估数据
 */
function extractEvaluations(): MoveEvaluation[] | undefined {
  const evaluations: MoveEvaluation[] = [];
  const moveElements = document.querySelectorAll('[class*="move-row"], [class*="move-node"], .move, [data-ply]');

  for (let i = 0; i < moveElements.length; i++) {
    const el = moveElements[i];
    const text = el.textContent?.trim() || '';
    const evalMatch = text.match(/([+-]?\d+\.?\d*)|(M\d+)/);
    if (evalMatch) {
      const evalStr = evalMatch[0];
      let evaluation: number | undefined;
      if (evalStr.startsWith('M')) {
        evaluation = 10000;
      } else {
        evaluation = parseFloat(evalStr) * 100;
      }
      const san = extractSanFromElement(el);
      evaluations.push({
        moveNumber: Math.floor(i / 2) + 1,
        san: san || '',
        evaluation,
        isMistake: evaluation !== undefined && evaluation < -100,
        isBlunder: evaluation !== undefined && evaluation < -300,
      });
    }
  }

  return evaluations.length > 0 ? evaluations : undefined;
}

/**
 * 从 DOM 元素提取 SAN 走法
 */
function extractSanFromElement(el: Element): string | null {
  const text = el.textContent?.trim() || '';
  const sanMatch = text.match(/([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[KQRBN])?[+#]?)|(O-O(-O)?)|(0-0(-0)?)/);
  if (sanMatch) return sanMatch[0];
  return el.getAttribute('data-move') || el.getAttribute('data-san') || null;
}

/**
 * 从 URL 提取游戏 ID
 */
function extractGameId(): string | undefined {
  const match = window.location.href.match(/\/game\/\w+\/(\d+)/);
  return match ? match[1] : undefined;
}

/**
 * 从页面移动列表提取 PGN
 */
function extractPgnFromPage(): string | null {
  const moveElements = Array.from(document.querySelectorAll('[class*="move"], .node'));
  if (moveElements.length === 0) return null;

  const whiteMoves: string[] = [];
  const blackMoves: string[] = [];
  let isWhite = true;

  for (const el of moveElements) {
    const text = el.textContent?.trim();
    if (text && /^[KQRBNP]?[a-h]?[1-8]?x?[a-h][1-8]/.test(text)) {
      if (isWhite) whiteMoves.push(text);
      else blackMoves.push(text);
      isWhite = !isWhite;
    }
  }

  if (whiteMoves.length === 0 && blackMoves.length === 0) return null;

  let pgn = '';
  for (let i = 0; i < whiteMoves.length; i++) {
    pgn += `${i + 1}. ${whiteMoves[i]}`;
    if (blackMoves[i]) pgn += ` ${blackMoves[i]}`;
    pgn += '\n';
  }
  return pgn;
}

/**
 * 检查是否在游戏结束页面
 */
function isGameOverPage(): boolean {
  if (!window?.location?.hostname) return false;
  if (window.location.hostname.includes('chess.com')) {
    return /https:\/\/www\.chess\.com\/game\/\w+\/\d+/.test(window.location.href);
  } else if (window.location.hostname.includes('lichess')) {
    return /https:\/\/lichess\.org\/\w+\/\w+$/.test(window.location.href);
  }
  return false;
}

export default {
  matches: ['*://*.chess.com/*', '*://*.lichess.org/*'],

  main() {
    console.log('[Chess Coach] Content script loaded on', window.location?.href || 'unknown');

    // 监听来自 popup 的消息
    chrome.runtime.onMessage.addListener((message: ChromeMessage, _sender, sendResponse) => {
      console.log('[Chess Coach] Content received message:', message.type);

      if (message.type === 'GET_GAME') {
        const isAnalysisPage = window.location.href.includes('/analysis/');
        console.log('[Chess Coach] Is analysis page:', isAnalysisPage);

        if (!isAnalysisPage && !isGameOverPage()) {
          sendResponse({
            type: 'ERROR',
            payload: '请在游戏结束页面或分析页面使用此功能',
          } as ChromeMessage);
          return true;
        }

        const pgnData = extractFromChessCom();
        if (pgnData) {
          console.log('[Chess Coach] Extracted PGN, length:', pgnData.pgn.length);
          sendResponse({
            success: true,
            pgn: pgnData.pgn,
            url: pgnData.url,
            gameId: pgnData.gameId,
          });
        } else {
          sendResponse({
            type: 'ERROR',
            payload: '无法提取棋局数据，请确保页面已完全加载',
          } as ChromeMessage);
        }
      }

      return true;
    });

    if (isGameOverPage()) {
      console.log('[Chess Coach] Game over page detected');
    }
  },
};
