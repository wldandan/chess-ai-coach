// Shared types for Chess Coach Extension

export interface Game {
  id: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  date: string;
  pgnSource?: 'api' | 'review-page' | 'page-extraction' | 'none';
}

export interface MoveAnalysis {
  move: string;
  moveNumber: number;
  side: 'white' | 'black';
  fen: string;
  score: number;
  bestMove: string;
  bestScore: number;
  mistake: boolean;
  blunder: boolean;
  explanation?: string;
}

export interface MistakeDetail {
  move: string;
  moveNumber: number;
  yourMove: string;
  bestMove: string;
  explanation: string;
  practicePuzzle?: string;
}

export interface OverallAnalysis {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  keyMistakes: Array<{ moveNumber: number; move: string; analysis: string }>;
  improvementTips: string[];
}

export interface GameAnalysis {
  gameId: string;
  mistakes: MoveAnalysis[];
}

export interface ChromeMessage {
  type: 'GET_GAME' | 'GAME_DATA' | 'ANALYZE_GAME' | 'START_REVIEW';
  payload?: Game | { gameId: string; pgn: string };
  gameId?: string;
  username?: string;
}

export interface UserConfig {
  username: string;
  analysisMode: 'chess-com' | 'local-rules' | 'ai';
  apiKey: string;
}
