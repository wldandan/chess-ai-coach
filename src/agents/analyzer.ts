/**
 * Analyzer Agent - 棋局分析引擎
 * 
 * 使用 Stockfish 引擎分析 PGN，识别漏着与妙着
 */

import { Chess } from 'chess.js';

// ===== 类型定义 =====

export interface MoveAnalysis {
  move_number: number;
  side: 'white' | 'black';
  fen: string;
  move: string;
  evaluation_before: number;
  evaluation_after: number;
  best_move: string;
  delta: number;
  comment: string;
}

export interface AnalysisResult {
  game_id: string;
  total_moves: number;
  accuracy: number;
  blunders: MoveAnalysis[];
  brilliants: MoveAnalysis[];
  overall_comment: string;
}

export interface GameInfo {
  white: string;
  black: string;
  result: string;
  date?: string;
  event?: string;
}

// ===== 评估差阈值 =====
const BLUNDER_THRESHOLD = 0.5;   // 漏着：评估差 > 0.5
const BRILLIANT_THRESHOLD = 0.8;  // 妙着：评估差 > 0.8

// ===== 辅助函数 =====

/**
 * 简单评估函数（无 Stockfish 时的降级方案）
 * 基于棋子价值进行简单评估
 */
function simpleEvaluate(fen: string): number {
  const pieceValues: Record<string, number> = {
    'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9, 'k': 0,
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0
  };

  let score = 0;
  const fenParts = fen.split(' ');
  const position = fenParts[0];

  for (const char of position) {
    if (pieceValues[char] !== undefined) {
      score += pieceValues[char];
    }
  }

  // 转换为近似 centipawn 评估 (pawn = 100 centipawns)
  return score * 20;
}

/**
 * 生成评估差对应的趣味评论
 */
function generateComment(move: string, delta: number, isBlunder: boolean): string {
  if (isBlunder) {
    if (delta < -2) return `${move} 这步太伤了！对面笑开花 😢`;
    if (delta < -1.5) return `${move} 象/车被抽了！血亏 😱`;
    if (delta < -1) return `${move} 局面崩了，这步值得反思 💔`;
    return `${move} 稍微有点问题，对手赚到了 😅`;
  } else {
    if (delta > 3) return `${move} 神之一手！对面直接懵了 😎`;
    if (delta > 2) return `${move} 绝妙！这一步太精彩了 ✨`;
    if (delta > 1.5) return `${move} 好棋！局面瞬间明朗 🌟`;
    if (delta > 1) return `${move} 不错不错，这步很舒服 👍`;
    return `${move} 好棋！小赚一笔 💪`;
  }
}

// ===== 核心功能 =====

/**
 * 解析 PGN 为 FEN 序列
 */
export function parsePGN(pgn: string): { fens: string[]; moves: string[]; gameInfo: GameInfo } {
  const chess = new Chess();
  const fens: string[] = [];
  const moves: string[] = [];

  // 初始局面
  fens.push(chess.fen());

  try {
    chess.loadPgn(pgn);
    const history = chess.history({ verbose: true });

    // 重置到初始局面，逐步推进
    chess.reset();
    
    for (const move of history) {
      moves.push(move.san);
      chess.move(move.san);
      fens.push(chess.fen());
    }
  } catch (e) {
    console.error('PGN 解析失败:', e);
    throw new Error(`PGN 解析失败: ${e}`);
  }

  // 提取游戏信息
  const headers = chess.header();
  const gameInfo: GameInfo = {
    white: headers.White || 'Unknown',
    black: headers.Black || 'Unknown',
    result: headers.Result || '*',
    date: headers.Date,
    event: headers.Event
  };

  return { fens, moves, gameInfo };
}

/**
 * 评估单步棋
 * @param fen 走棋前的 FEN
 * @param move 实际走的棋 (SAN 格式)
 * @param useStockfish 是否使用 Stockfish（默认 false，使用简单评估）
 * @returns 评估结果
 */
export async function analyzeMove(
  fen: string,
  move: string,
  useStockfish: boolean = false
): Promise<{ evaluation_before: number; evaluation_after: number; best_move: string }> {
  const chess = new Chess(fen);

  // 评估走棋前的局面
  const evaluation_before = useStockfish 
    ? await stockfishEvaluate(fen) 
    : simpleEvaluate(fen);

  // 执行棋步
  try {
    chess.move(move);
  } catch (e) {
    console.error(`无效的棋步: ${move}, FEN: ${fen}`);
    throw new Error(`无效的棋步: ${move}`);
  }

  const fenAfter = chess.fen();
  
  // 评估走棋后的局面
  const evaluation_after = useStockfish 
    ? await stockfishEvaluate(fenAfter) 
    : simpleEvaluate(fenAfter);

  // 找最佳棋步（简化：返回评估值最高的候选）
  const best_move = useStockfish 
    ? await stockfishBestMove(fen, move) 
    : 'N/A';

  return { evaluation_before, evaluation_after, best_move };
}

/**
 * Stockfish 评估（需要 Stockfish WASM 支持）
 */
async function stockfishEvaluate(fen: string): Promise<number> {
  // TODO: 集成 Stockfish WASM
  // 目前降级到简单评估
  console.warn('Stockfish 未集成，使用简单评估');
  return simpleEvaluate(fen);
}

/**
 * Stockfish 找最佳棋步
 */
async function stockfishBestMove(fen: string, currentMove: string): Promise<string> {
  // TODO: 集成 Stockfish WASM
  return 'N/A';
}

/**
 * 查找漏着和妙着
 * @param pgn PGN 棋谱
 * @param userSide 用户执棋方 ('white' | 'black')
 * @param useStockfish 是否使用 Stockfish
 * @returns 分析结果
 */
export async function findBlundersAndBrilliants(
  pgn: string,
  userSide: 'white' | 'black' = 'white',
  useStockfish: boolean = false
): Promise<Omit<AnalysisResult, 'game_id' | 'overall_comment'>> {
  const { fens, moves, gameInfo } = parsePGN(pgn);

  const blunders: MoveAnalysis[] = [];
  const brilliants: MoveAnalysis[] = [];
  const userColor = userSide === 'white' ? 'w' : 'b';

  for (let i = 1; i < fens.length; i++) {
    const fenBefore = fens[i - 1];
    const fenAfter = fens[i];
    const move = moves[i - 1];
    
    // 判断是哪一方走棋
    const fenParts = fenBefore.split(' ');
    const sideToMove = fenParts[1] as 'w' | 'b';
    const isUserMove = sideToMove === userColor;
    const moveNumber = Math.ceil(i / 2);
    const side = sideToMove === 'w' ? 'white' : 'black';

    // 评估
    const { evaluation_before, evaluation_after } = await analyzeMove(fenBefore, move, useStockfish);
    const delta = evaluation_after - evaluation_before;

    const analysis: MoveAnalysis = {
      move_number: moveNumber,
      side,
      fen: fenBefore,
      move,
      evaluation_before: evaluation_before / 100, // 转换为 pawn 单位
      evaluation_after: evaluation_after / 100,
      best_move: 'N/A',
      delta: delta / 100,
      comment: ''
    };

    if (isUserMove) {
      // 用户走棋：妙着 (delta > 0.8) 或 漏着 (delta < -0.5)
      if (delta / 100 > BRILLIANT_THRESHOLD) {
        analysis.comment = generateComment(move, delta / 100, false);
        brilliants.push(analysis);
      } else if (delta / 100 < -BLUNDER_THRESHOLD) {
        analysis.comment = generateComment(move, delta / 100, true);
        blunders.push(analysis);
      }
    } else {
      // 对手走棋：反转评估方向
      if (delta / 100 < -BRILLIANT_THRESHOLD) {
        // 对手走了一步好棋（漏着）
        analysis.comment = `${move} 对手走出妙着！`;
        blunders.push(analysis);
      } else if (delta / 100 > BLUNDER_THRESHOLD) {
        // 对手失误（妙着）
        analysis.comment = `${move} 对手这步有问题，我方占优！`;
        brilliants.push(analysis);
      }
    }
  }

  const totalUserMoves = Math.ceil((fens.length - 1) / 2);
  const accuracy = calculateAccuracy(blunders, brilliants, totalUserMoves);

  return {
    total_moves: fens.length - 1,
    accuracy,
    blunders,
    brilliants
  };
}

/**
 * 计算准确率
 * 公式: accuracy = 100 - (blunders * 5) + (brilliants * 3)
 * 范围: 0-100
 */
export function calculateAccuracy(
  blunders: MoveAnalysis[],
  brilliants: MoveAnalysis[],
  total: number
): number {
  if (total === 0) return 0;

  const blunderPenalty = blunders.length * 5;
  const brilliantBonus = brilliants.length * 3;
  
  let accuracy = 100 - blunderPenalty + brilliantBonus;
  
  // 确保在 0-100 范围内
  accuracy = Math.max(0, Math.min(100, accuracy));
  
  // 保留一位小数
  return Math.round(accuracy * 10) / 10;
}

/**
 * 生成整体评论
 */
function generateOverallComment(accuracy: number, blunders: number, brilliants: number): string {
  if (accuracy >= 90) return '完美表现！这棋下的简直是天方夜谭 👑';
  if (accuracy >= 80) return '相当不错！进攻犀利，继续保持 🏆';
  if (accuracy >= 70) return '中规中矩，还有提升空间 📈';
  if (accuracy >= 60) return '需要多练习，防守意识要加强 🎯';
  return '建议重修基础，多做战术题 📚';
}

/**
 * 完整分析函数
 */
export async function analyzeGame(
  pgn: string,
  gameId: string = 'unknown',
  userSide: 'white' | 'black' = 'white',
  useStockfish: boolean = false
): Promise<AnalysisResult> {
  const { blunders, brilliants, total_moves } = await findBlundersAndBrilliants(pgn, userSide, useStockfish);
  const accuracy = calculateAccuracy(blunders, brilliants, Math.ceil(total_moves / 2));

  return {
    game_id: gameId,
    total_moves,
    accuracy,
    blunders,
    brilliants,
    overall_comment: generateOverallComment(accuracy, blunders.length, brilliants.length)
  };
}
