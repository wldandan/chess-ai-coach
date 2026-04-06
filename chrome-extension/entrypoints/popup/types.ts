// Popup types

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

export interface UserConfig {
  username: string;
  analysisMode: 'chess-com' | 'local-rules' | 'ai';
  apiKey: string;
  agentUrl: string;
  provider?: 'openclaw' | 'opencode';
}
