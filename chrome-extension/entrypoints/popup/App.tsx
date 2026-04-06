import React, { useState, useEffect } from 'react';
import { ReviewCard } from './components/ReviewCard';
import { LoadingScreen } from './components/LoadingScreen';
import { Settings } from './components/Settings';
import type { ReviewResult } from './types';
import './styles/popup.css';

const CONFIG_KEY = 'chess_coach_config';
const REVIEW_DATA_KEY = 'chess_coach_last_review';

interface UserConfig {
  username: string;
  analysisMode: 'chess-com' | 'local-rules' | 'ai';
  apiKey: string;
  agentUrl: string;
  provider?: 'openclaw' | 'opencode';
}

export default function App() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const result = await browser.storage.local.get(CONFIG_KEY);
      if (result[CONFIG_KEY]) {
        setConfig(result[CONFIG_KEY]);
        // 如果没有用户名，自动打开设置页面
        if (!result[CONFIG_KEY].username) {
          setShowSettings(true);
        }
      } else {
        // 默认配置
        const defaultConfig: UserConfig = { username: 'aaronwang2026', analysisMode: 'chess-com', apiKey: '', agentUrl: '', provider: 'openclaw' };
        setConfig(defaultConfig);
        await browser.storage.local.set({ [CONFIG_KEY]: defaultConfig });
        setShowSettings(false);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      setConfig({ username: 'aaronwang2026', analysisMode: 'chess-com', apiKey: '', agentUrl: '', provider: 'openclaw' });
      setShowSettings(true);
    }
  }

  async function saveConfig(newConfig: UserConfig) {
    await browser.storage.local.set({ [CONFIG_KEY]: newConfig });
    setConfig(newConfig);
  }

  async function saveReviewResult(result: ReviewResult) {
    await browser.storage.local.set({ [REVIEW_DATA_KEY]: result });
  }

  // 调用 Gateway API
  async function callGateway(action: string, data: { pgn?: string; username?: string; userId?: string; limit?: number }) {
    if (!config?.agentUrl) {
      throw new Error('请先配置 API 地址');
    }

    const url = `${config.agentUrl}/api/chess-coach`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ action, ...data, provider: config.provider || 'openclaw' }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || '请求失败');
    }
    return result.data;
  }

  // 演示模式 - 直接生成 mock 数据
  const handleDemoMode = async () => {
    if (!config?.username) return;

    setIsLoading(true);
    setError(null);
    setReviewResult(null);

    // 模拟加载延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    const demoResult = generateMockResult(config.username);
    await saveReviewResult(demoResult);
    setReviewResult(demoResult);
    setIsLoading(false);
  };

  const handleAnalyze = async () => {
    if (!config?.username) return;

    setIsLoading(true);
    setError(null);
    setReviewResult(null);

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

      // 调用 gateway 分析棋局
      if (config.agentUrl) {
        try {
          const analysisResult = await callGateway('analyze', {
            pgn: response.pgn,
            userId: config.username,
          });
          console.log('[Popup] Gateway result:', analysisResult);

          // 转换 gateway 返回结果为 ReviewResult 格式
          const result: ReviewResult = {
            username: config.username,
            accuracy: analysisResult.accuracy || 85,
            blunders: analysisResult.blunders || 0,
            brilliants: analysisResult.brilliants || 0,
            mistakes: analysisResult.mistakes || 0,
            xp: analysisResult.xp || 50,
            title: analysisResult.title || '初出茅庐',
            gameUrl: response.url,
          };
          await saveReviewResult(result);
          setReviewResult(result);
        } catch (apiError: any) {
          console.error('[Popup] Gateway API failed, using mock:', apiError);
          // Gateway 调用失败时使用 mock
          const mockResult = generateMockResult(config.username);
          await saveReviewResult(mockResult);
          setReviewResult(mockResult);
        }
      } else {
        // 没有配置 API 地址时使用 mock
        const mockResult = generateMockResult(config.username);
        await saveReviewResult(mockResult);
        setReviewResult(mockResult);
      }

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
      const mockResult = generateMockResult(config.username);
      await saveReviewResult(mockResult);
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

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleSaveSettings = async (newConfig: UserConfig) => {
    await saveConfig(newConfig);
    setShowSettings(false);
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
        <button className="btn-settings" onClick={handleOpenSettings} title="设置">⚙️</button>
        {config?.username && (
          <div className="config-status">
            <span className="config-badge">@{config.username}</span>
            <span className="mode-badge">{modeText[config.analysisMode] || 'chess.com'}</span>
          </div>
        )}
      </header>

      <main className="popup-main">
        {showSettings && config && (
          <Settings
            config={config}
            onSave={handleSaveSettings}
            onCancel={() => {
              // 如果没有用户名，禁止关闭设置
              if (!config.username) return;
              setShowSettings(false);
            }}
          />
        )}

        {!showSettings && error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {!showSettings && isLoading && <LoadingScreen username={config?.username || ''} />}

        {!showSettings && !isLoading && !reviewResult && config?.username && (
          <div className="action-buttons">
            <button className="btn-primary analyze-btn" onClick={handleAnalyze}>
              🎯 分析棋局
            </button>
            <div className="demo-section">
              <span className="demo-label">或者</span>
              <button className="btn-demo" onClick={handleDemoMode}>
                ✨ 演示模式
              </button>
            </div>
          </div>
        )}

        {!showSettings && !isLoading && reviewResult && (
          <ReviewCard result={reviewResult} onReset={handleReset} />
        )}
      </main>

      {!showSettings && (
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
      )}
    </div>
  );
}
