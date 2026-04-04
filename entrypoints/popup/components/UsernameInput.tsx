import React, { useState } from 'react';

interface Props {
  onAnalyze: (username: string) => void;
}

export function UsernameInput({ onAnalyze }: Props) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAnalyze(inputValue.trim());
    }
  };

  return (
    <div className="username-input-container">
      <div className="hero-section">
        <div className="hero-icon">♟️</div>
        <h2>开始你的复盘之旅!</h2>
        <p>输入你的 chess.com 用户名</p>
      </div>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <span className="input-prefix">@</span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="你的用户名"
            className="username-input"
            autoFocus
            autoComplete="off"
          />
        </div>
        <button type="submit" className="btn-primary analyze-btn" disabled={!inputValue.trim()}>
          🔍 开始分析
        </button>
      </form>

      <div className="features-hint">
        <div className="hint-item">
          <span>📊</span> 准确率分析
        </div>
        <div className="hint-item">
          <span>✨🔴🟡</span> 妙着 & 漏着
        </div>
        <div className="hint-item">
          <span>⭐</span> XP & 称号
        </div>
      </div>
    </div>
  );
}
