import React, { useEffect, useState } from 'react';

interface Props {
  username: string;
}

const loadingSteps = [
  { emoji: '🔍', text: '正在抓取对局数据...', delay: 0 },
  { emoji: '📊', text: '分析每一步棋...', delay: 800 },
  { emoji: '🧠', text: 'AI 正在思考...', delay: 1600 },
  { emoji: '✨', text: '生成趣味复盘...', delay: 2400 },
  { emoji: '🏆', text: '完成!', delay: 3200 },
];

export function LoadingScreen({ username }: Props) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    
    loadingSteps.forEach((step, index) => {
      if (index > 0) {
        timers.push(window.setTimeout(() => {
          setCurrentStep(index);
        }, step.delay));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="loading-screen">
      <div className="chess-loader">
        <div className="chess-piece">♚</div>
        <div className="chess-piece">♛</div>
        <div className="chess-piece">♜</div>
        <div className="chess-piece">♝</div>
        <div className="chess-piece">♞</div>
        <div className="chess-piece">♟️</div>
      </div>

      <div className="loading-content">
        <p className="loading-user">@{username}</p>
        <div className="loading-steps">
          {loadingSteps.slice(0, currentStep + 1).map((step, index) => (
            <div key={index} className="loading-step">
              <span className="step-emoji">{step.emoji}</span>
              <span className="step-text">{step.text}</span>
            </div>
          ))}
          {currentStep < loadingSteps.length - 1 && (
            <div className="loading-step active">
              <span className="step-emoji spinner">⚡</span>
              <span className="step-text">思考中...</span>
            </div>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
