import React, { useState, useEffect } from 'react';
import { ReviewCard } from './components/ReviewCard';
import { UsernameInput } from './components/UsernameInput';
import { LoadingScreen } from './components/LoadingScreen';
import type { ReviewResult } from './types';
import './styles/popup.css';

const CONFIG_KEY = 'chess_coach_config';

interface UserConfig {
  username: string;
  analysisMode: 'chess-com' | 'local-rules' | 'ai';
  apiKey: string;
}

export default function App() {
  const [username, setUsername] = useState('');
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const result = await browser.storage.local.get(CONFIG_KEY);
      if (result[CONFIG_KEY]) {
        setConfig(result[CONFIG_KEY]);
        setUsername(result[CONFIG_KEY].username || '');
      } else {
        // 默认配置
        const defaultConfig: UserConfig = { username: '', analysisMode: 'chess-com', apiKey: '' };
        setConfig(defaultConfig);
        await browser.storage.local.set({ [CONFIG_KEY]: defaultConfig });
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      setConfig({ username: '', analysisMode: 'chess-com', apiKey: '' });
    }
  }

  async function saveConfig(newConfig: UserConfig) {
    await browser.storage.local.set({ [CONFIG_KEY]: newConfig });
    setConfig(newConfig);
  }

  // 演示模式 - 直接生成 mock 数据
  const handleDemoMode = async (user: string) => {
    setUsername(user);
    setIsLoading(true);
    setError(null);
    setReviewResult(null);

    await saveConfig({ ...config!, username: user });

    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    const demoResult = generateMockResult(user);
    setReviewResult(demoResult);
    setIsLoading(false);
  };

  const handleAnalyze = async (user: string) => {
    setUsername(user);
    setIsLoading(true);
    setError(null);
    setReviewResult(null);

    await saveConfig({ ...config!, username: user });

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

      if (!tab.id || !tab.url?.includes('chess.com')) {
        throw new Error('NOT_CHESS_COM');
      }

      if (!tab.url?.includes('/game/')) {
        throw new Error('NOT_GAME_PAGE');
      }

      // 发送消息给 content script
      let response = null;
      for (let i = 0; i < 3; i++) {
        try {
          response = await browser.tabs.sendMessage(tab.id, { type: 'GET_GAME' });
          break;
        } catch (e) {
          if (i === 2) throw e;
          await new Promise(r => setTimeout(r, 500));
        }
      }

      if (!response?.success) {
        throw new Error(response?.payload || '获取棋局失败');
      }

      console.log('[Popup] Got game data:', {
        id: response.gameId,
        pgnLength: response.pgn?.length,
      });

      // 有真实 PGN 时可以用 mock 数据模拟分析
      const mockResult = generateMockResult(user);
      setReviewResult(mockResult);

    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMsg = error.message || '获取棋局失败';

      if (errorMsg === 'NOT_CHESS_COM') {
        setError('请在 chess.com 棋局页面点击分析');
      } else if (errorMsg === 'NOT_GAME_PAGE') {
        setError('请打开一个棋局页面后再分析');
      } else if (errorMsg.includes('Receiving end does not exist')) {
        setError('请刷新 chess.com 页面后重试');
      } else {
        setError(errorMsg);
      }

      // 出错时也显示 mock 结果作为演示
      const mockResult = generateMockResult(user);
      setReviewResult(mockResult);
    } finally {
      setIsLoading(false);
    }
  };

  function generateMockResult(user: string): ReviewResult {
    const accuracies = [78.5, 82.3, 85.1, 88.7, 91.2, 76.4, 89.3];
    const accuracy = accuracies[Math.floor(Math.random() * accuracies.length)];
    const blunders = Math.floor(Math.random() * 4);
    const mistakes = Math.floor(Math.random() * 5);
    const brilliants = Math.floor(Math.random() * 3);

    let xp = 50;
    xp += Math.round(accuracy * 0.5);
    xp += brilliants * 15;
    xp -= blunders * 10;
    xp = Math.max(0, xp);

    let title = '初出茅庐';
    if (accuracy >= 95) title = '棋王';
    else if (accuracy >= 90) title = '大师之路';
    else if (accuracy >= 85) title = '战术高手';
    else if (accuracy >= 80) title = '棋坛新秀';
    else if (accuracy >= 75) title = '战术新星';

    return {
      username: user,
      accuracy,
      blunders,
      brilliants,
      mistakes,
      xp,
      title,
    };
  }

  const handleReset = () => {
    setReviewResult(null);
    setError(null);
  };

  const modeText: Record<string, string> = {
    'chess-com': 'chess.com',
    'local-rules': '本地规则',
    'ai': 'AI',
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>🏆 Chess Coach</h1>
        <p className="subtitle">AI 复盘助手</p>
        {config?.username && (
          <div className="config-status">
            <span className="config-badge">@{config.username}</span>
            <span className="mode-badge">{modeText[config.analysisMode] || 'chess.com'}</span>
          </div>
        )}
      </header>

      <main className="popup-main">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {isLoading && <LoadingScreen username={username} />}

        {!isLoading && !reviewResult && (
          <UsernameInput
            onAnalyze={handleAnalyze}
            onDemoMode={handleDemoMode}
            savedUsername={username}
          />
        )}

        {!isLoading && reviewResult && (
          <ReviewCard result={reviewResult} onReset={handleReset} />
        )}
      </main>

      <footer className="popup-footer">
        <span>💡 右键点击 chess.com 页面可快速启动复盘</span>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleReset();
          }}
        >
          重置
        </a>
      </footer>
    </div>
  );
}
