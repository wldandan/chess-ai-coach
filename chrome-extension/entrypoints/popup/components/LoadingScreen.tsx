import React, { useEffect, useState } from 'react';

interface Props {
  username: string;
  mode?: 'demo' | 'analyze';
  currentStep?: number;
}

const demoSteps = [
  { emoji: '🔍', text: '正在抓取对局数据...', delay: 0 },
  { emoji: '📊', text: '分析每一步棋...', delay: 800 },
  { emoji: '🧠', text: 'AI 正在思考...', delay: 1600 },
  { emoji: '✨', text: '生成趣味复盘...', delay: 2400 },
  { emoji: '🏆', text: '完成!', delay: 3200 },
];

const analyzeSteps = [
  { emoji: '🔍', text: '正在获取棋局...', delay: 0 },
  { emoji: '📡', text: '正在连接服务器...', delay: 600 },
  { emoji: '📊', text: '正在分析棋局...', delay: 1200 },
  { emoji: '🧠', text: 'AI 正在思考...', delay: 1800 },
  { emoji: '✨', text: '生成复盘结果...', delay: 2400 },
];

export function LoadingScreen({ username, mode = 'demo', currentStep: externalStep }: Props) {
  const [internalStep, setInternalStep] = useState(0);
  const steps = mode === 'analyze' ? analyzeSteps : demoSteps;
  const currentStep = externalStep ?? internalStep;

  useEffect(() => {
    // 如果是外部控制步骤，不启动内部定时器
    if (externalStep !== undefined) return;

    const timers: number[] = [];

    steps.forEach((step, index) => {
      if (index > 0) {
        timers.push(window.setTimeout(() => {
          setInternalStep(index);
        }, step.delay));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [externalStep]);

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
          <div className="loading-step active" key={currentStep}>
            <span className="step-emoji spinner">{steps[currentStep].emoji}</span>
            <span className="step-text">{steps[currentStep].text}</span>
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
