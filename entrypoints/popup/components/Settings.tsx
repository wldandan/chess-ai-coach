import React, { useState, useEffect } from 'react';
import type { UserConfig } from '../types';

interface Props {
  config: UserConfig;
  onSave: (config: UserConfig) => void;
  onCancel: () => void;
}

export function Settings({ config, onSave, onCancel }: Props) {
  const [username, setUsername] = useState(config.username);
  const [agentUrl, setAgentUrl] = useState(config.agentUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [provider, setProvider] = useState<'openclaw' | 'opencode'>(config.provider || 'openclaw');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setUsername(config.username);
    setAgentUrl(config.agentUrl);
    setApiKey(config.apiKey);
    setProvider(config.provider || 'openclaw');
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setMessage({ text: '请输入用户名', type: 'error' });
      return;
    }

    if (!agentUrl.trim()) {
      setMessage({ text: '请填写 API 地址', type: 'error' });
      return;
    }

    onSave({
      username: username.trim(),
      agentUrl: agentUrl.trim(),
      analysisMode: config.analysisMode,
      apiKey: apiKey.trim(),
      provider: provider,
    });

    setMessage({ text: '✅ 配置已保存', type: 'success' });
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h2>⚙️ 设置</h2>
        <button className="btn-icon" onClick={onCancel} title="返回">←</button>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="username">chess.com 用户名</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="例如: aaronwang2026"
          />
        </div>

        <div className="form-group">
          <label htmlFor="agentUrl">API 地址</label>
          <input
            type="text"
            id="agentUrl"
            value={agentUrl}
            onChange={(e) => setAgentUrl(e.target.value)}
            placeholder="http://124.156.195.28:18790"
          />
          <span className="hint">Chess Coach Gateway API 地址</span>
        </div>

        <div className="form-group">
          <label htmlFor="provider">分析引擎</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'openclaw' | 'opencode')}
          >
            <option value="openclaw">OpenClaw (Stockfish + LLM)</option>
            <option value="opencode">OpenCode (GPT/Claude)</option>
          </select>
          <span className="hint">
            {provider === 'openclaw' ? '本地引擎 + AI 复盘' : '直接调用 OpenCode LLM'}
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">访问密钥</label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="访问 Gateway 的密钥"
          />
          <span className="hint">联系管理员获取访问密钥</span>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn-primary">
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
