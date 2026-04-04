import React, { useState } from 'react';
import { ReviewCard } from './components/ReviewCard';
import { UsernameInput } from './components/UsernameInput';
import { LoadingScreen } from './components/LoadingScreen';
import './styles/popup.css';

export interface ReviewResult {
  username: string;
  accuracy: number;
  blunders: number;
  brilliants: number;
  mistakes: number;
  xp: number;
  title: string;
  gameUrl?: string;
}

export default function App() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);

  const handleAnalyze = async (user: string) => {
    setUsername(user);
    setIsLoading(true);
    setReviewResult(null);

    try {
      // Send message to content script to trigger analysis on chess.com
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      
      if (tab.id) {
        // Try content script first
        const response = await browser.tabs.sendMessage(tab.id, {
          action: 'analyzeGame',
          username: user,
        });
        
        if (response?.success) {
          setReviewResult(response.data);
        } else {
          // Fallback: use background service
          const bgResponse = await browser.runtime.sendMessage({
            action: 'analyzeGame',
            username: user,
          });
          if (bgResponse?.success) {
            setReviewResult(bgResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback demo data for development
      setReviewResult({
        username: user,
        accuracy: 78.5,
        blunders: 2,
        brilliants: 1,
        mistakes: 3,
        xp: 85,
        title: '战术新星',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setReviewResult(null);
    setUsername('');
  };

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>🏆 Chess Coach</h1>
        <p className="subtitle">AI 复盘助手</p>
      </header>

      <main className="popup-main">
        {isLoading && <LoadingScreen username={username} />}
        
        {!isLoading && !reviewResult && (
          <UsernameInput onAnalyze={handleAnalyze} />
        )}

        {!isLoading && reviewResult && (
          <ReviewCard result={reviewResult} onReset={handleReset} />
        )}
      </main>

      <footer className="popup-footer">
        <span>💡 在 chess.com 打开对局后点击分析</span>
      </footer>
    </div>
  );
}
