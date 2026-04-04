/**
 * Chess Engine Agent
 * 
 * 使用 Stockfish 引擎分析 PGN，识别漏着与妙着
 * 暂时使用 mock 数据，后续集成真实 Stockfish WASM
 */

import { Chess } from 'chess.js';

export interface Blunder {
  move: number;
  san: string;
  comment: string;
  evalLoss: number;
  bestMove: string;
}

export interface Brilliant {
  move: number;
  san: string;
  comment: string;
  evalGain: number;
}

export interface PhaseScores {
  opening: number;
  middlegame: number;
  endgame: number;
  defense: number;
  attack: number;
}

export class ChessEngineAgent {
  /**
   * 分析 PGN 棋谱
   */
  async analyze(pgn: string): Promise<{
    accuracy: number;
    blunders: Blunder[];
    brilliants: Brilliant[];
    opening: string;
    timeControl: string;
    opponent: string;
    result: 'win' | 'lose' | 'draw';
    phaseScores: PhaseScores;
  }> {
    console.log(`[Engine] Analyzing PGN...`);

    try {
      // 解析 PGN
      const chess = new Chess();
      chess.loadPgn(pgn);

      // 获取对局信息
      const headers = chess.header();
      const moves = this.getMoves(chess);
      const timeControl = headers.TimeControl || 'unknown';
      const opponent = headers.Black === headers.White ? 'Unknown' : 
        (headers.White === 'User' ? headers.Black : headers.White);
      
      // 判断结果
      let result: 'win' | 'lose' | 'draw' = 'draw';
      if (headers.Result === '1-0') result = 'win';
      else if (headers.Result === '0-1') result = 'lose';

      // 识别开局
      const opening = this.identifyOpening(moves);

      // 简化分析：基于规则识别漏着和妙着
      // 真实实现会调用 Stockfish WASM
      const { blunders, brilliants } = this.analyzeMoves(chess, moves);

      // 计算准确率（简化版）
      const totalMistakes = blunders.length;
      const accuracy = Math.max(50, Math.min(98, 100 - totalMistakes * 8));

      // 各阶段评分
      const phaseScores: PhaseScores = {
        opening: 0.7 + Math.random() * 0.25,
        middlegame: 0.6 + Math.random() * 0.3,
        endgame: 0.65 + Math.random() * 0.25,
        defense: 0.55 + Math.random() * 0.35,
        attack: 0.6 + Math.random() * 0.3,
      };

      return {
        accuracy,
        blunders,
        brilliants,
        opening,
        timeControl,
        opponent,
        result,
        phaseScores,
      };
    } catch (error) {
      console.error(`[Engine] Analysis error:`, error);
      // 返回默认值
      return {
        accuracy: 75,
        blunders: [],
        brilliants: [],
        opening: 'Unknown',
        timeControl: 'unknown',
        opponent: 'Unknown',
        result: 'draw',
        phaseScores: {
          opening: 0.7,
          middlegame: 0.65,
          endgame: 0.7,
          defense: 0.6,
          attack: 0.65,
        },
      };
    }
  }

  /**
   * 获取所有着法
   */
  private getMoves(chess: Chess): string[] {
    const moves: string[] = [];
    const history = chess.history();
    
    // 过滤掉注释和结果
    for (const move of history) {
      if (move && !move.includes('=') && !move.includes('+') && !move.includes('#')) {
        // 简单移动
        moves.push(move);
      } else if (move) {
        moves.push(move);
      }
    }
    
    return moves;
  }

  /**
   * 识别开局
   */
  private identifyOpening(moves: string[]): string {
    if (moves.length < 2) return 'Unknown';

    const firstMoves = moves.slice(0, 6).join(' ').toLowerCase();

    // 常见开局
    if (firstMoves.includes('e4') && firstMoves.includes('c5')) {
      return 'Sicilian Defense';
    }
    if (firstMoves.includes('e4') && firstMoves.includes('e5')) {
      if (firstMoves.includes('nf3') && firstMoves.includes('nc6') && firstMoves.includes('bb5')) {
        return 'Ruy Lopez';
      }
      if (firstMoves.includes('nf3') && firstMoves.includes('nc6') && firstMoves.includes('bc4')) {
        return 'Italian Game';
      }
      if (firstMoves.includes('nf3') && firstMoves.includes('nf6')) {
        return 'Petrov Defense';
      }
      return 'Open Game';
    }
    if (firstMoves.includes('d4') && firstMoves.includes('nf6')) {
      if (firstMoves.includes('c4') && firstMoves.includes('e6')) {
        return 'English Opening';
      }
      return 'Queen\'s Pawn Game';
    }
    if (firstMoves.includes('e4') && !firstMoves.includes('e5')) {
      return 'Semi-Open Game';
    }

    return 'Unknown Opening';
  }

  /**
   * 分析着法（简化版）
   * 真实实现需要 Stockfish WASM
   */
  private analyzeMoves(chess: Chess, moves: string[]): {
    blunders: Blunder[];
    brilliants: Brilliant[];
  } {
    // 简化：随机生成一些漏着和妙着用于演示
    // 真实实现需要：
    // 1. 重放每一步
    // 2. 用 Stockfish 评估
    // 3. 比较评估差

    const blunders: Blunder[] = [];
    const brilliants: Brilliant[] = [];

    // 示例：第24步可能有漏着
    if (moves.length >= 24) {
      blunders.push({
        move: 24,
        san: moves[23],
        comment: this.getBlunderComment(),
        evalLoss: 1.0 + Math.random() * 0.5,
        bestMove: 'Nf3',
      });
    }

    // 示例：第31步可能有妙着
    if (moves.length >= 31) {
      brilliants.push({
        move: 31,
        san: moves[30],
        comment: '皇后走到 c6 形成强烈威胁！',
        evalGain: 1.5 + Math.random() * 1.0,
      });
    }

    return { blunders, brilliants };
  }

  private getBlunderComment(): string {
    const comments = [
      '象被抽了，对手笑开花',
      '车被抽了，亏大了',
      '后被将军，白丢一子',
      '兵冲太前，被吃子',
      '王被将军，没看到',
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }
}
