import React from 'react';
import type { ReviewResult } from '../types';

interface Props {
  result: ReviewResult;
  onReset: () => void;
}

export function ReviewCard({ result, onReset }: Props) {
  const { username, accuracy, blunders, brilliants, mistakes, xp, title } = result;

  const getAccuracyColor = (acc: number) => {
    if (acc >= 85) return 'neon-green';
    if (acc >= 70) return 'neon-yellow';
    return 'neon-red';
  };

  const getTitleEmoji = (t: string) => {
    const map: Record<string, string> = {
      '初出茅庐': '🌱',
      '战术新星': '⭐',
      '棋坛新秀': '🎯',
      '战术高手': '🔥',
      '大师之路': '🏆',
      '棋王': '👑',
    };
    return map[t] || '🎖️';
  };

  return (
    <div className="review-card">
      <div className="card-header">
        <span className="user-badge">@{username}</span>
        <span className="title-badge">{getTitleEmoji(title)} {title}</span>
      </div>

      <div className="stats-grid">
        <div className={`accuracy-display ${getAccuracyColor(accuracy)}`}>
          <span className="stat-value">{accuracy.toFixed(1)}%</span>
          <span className="stat-label">📊 准确率</span>
        </div>

        <div className="xp-display">
          <span className="stat-value">+{xp} XP</span>
          <span className="stat-label">⭐ 经验值</span>
        </div>
      </div>

      <div className="moves-analysis">
        <div className="move-stat brilliants">
          <span className="emoji">✨</span>
          <span className="count">{brilliants}</span>
          <span className="label">妙着</span>
        </div>
        <div className="move-stat mistakes">
          <span className="emoji">🟡</span>
          <span className="count">{mistakes}</span>
          <span className="label">漏着</span>
        </div>
        <div className="move-stat blunders">
          <span className="emoji">🔴</span>
          <span className="count">{blunders}</span>
          <span className="label">大失误</span>
        </div>
      </div>

      <div className="card-footer card-footer-3col">
        <button className="btn-icon-text" onClick={() => {
          window.open(chrome.runtime.getURL('details.html'), '_blank');
        }}>
          <span className="btn-icon">📋</span>
          <span className="btn-label">查看</span>
          <span className="btn-label-sub">明细</span>
        </button>
        <button className="btn-icon-text" onClick={onReset}>
          <span className="btn-icon">🔄</span>
          <span className="btn-label">重新</span>
          <span className="btn-label-sub">分析</span>
        </button>
        <button className="btn-icon-text" onClick={() => {
          navigator.clipboard?.writeText(
            `🏆 Chess Coach 复盘结果\n` +
            `@${username}\n` +
            `📊 准确率: ${accuracy.toFixed(1)}%\n` +
            `⭐ XP: +${xp}\n` +
            `✨ 妙着: ${brilliants} | 🟡 漏着: ${mistakes} | 🔴 大失误: ${blunders}`
          );
        }}>
          <span className="btn-icon">📤</span>
          <span className="btn-label">分享</span>
          <span className="btn-label-sub">成果</span>
        </button>
      </div>
    </div>
  );
}
