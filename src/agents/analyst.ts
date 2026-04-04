/**
 * Chess Analyst Agent
 * 
 * AI 深度复盘分析 - 失误讲解、教学建议
 */

import type { Blunder, Brilliant } from './engine';

export interface ChessAnalystResult {
  summary: string;
  keyMistakes: KeyMistake[];
  bestMoves: BestMove[];
  openingInsight: string;
  todayLesson: string;
}

export interface KeyMistake {
  move: number;
  description: string;
  originalMove: string;
  suggestedMove: string;
  reason: string;
}

export interface BestMove {
  move: number;
  san: string;
  reason: string;
}

export class ChessAnalystAgent {
  /**
   * 生成深度复盘分析
   */
  async review(input: {
    pgn: string;
    accuracy: number;
    blunders: Blunder[];
    brilliants: Brilliant[];
    opening: string;
  }): Promise<ChessAnalystResult> {
    console.log(`[Analyst] Reviewing game...`);

    // 构造给 LLM 的 prompt
    const prompt = this.buildPrompt(input);

    // 调用 LLM（这里用模拟，以后接真实 baoyu）
    const llmResponse = await this.callLLM(prompt);

    return llmResponse;
  }

  /**
   * 构造 LLM Prompt
   */
  private buildPrompt(input: {
    pgn: string;
    accuracy: number;
    blunders: Blunder[];
    brilliants: Brilliant[];
    opening: string;
  }): string {
    const { accuracy, blunders, brilliants, opening } = input;

    const blunderList = blunders.length > 0
      ? blunders.map(b => `第${b.move}步 ${b.san}：${b.comment}（损失 ${b.evalLoss.toFixed(1)} 分）`).join('\n')
      : '无明显漏着';

    const brilliantList = brilliants.length > 0
      ? brilliants.map(b => `第${b.move}步 ${b.san}：${b.comment}（获得 ${b.evalGain.toFixed(1)} 分）`).join('\n')
      : '无妙着记录';

    return `你是 ChessCoach，一个为14岁小朋友提供国际象棋复盘分析的AI教练。

请分析这盘棋，生成结构化的复盘报告：

【基本信息】
- 准确率：${accuracy}%
- 开局：${opening}
- 漏着：${blunderList}
- 妙着：${brilliantList}

请用中文输出 JSON 格式的复盘报告：

{
  "summary": "总评（1-2句话概括这盘棋）",
  "keyMistakes": [
    {
      "move": 数字,
      "description": "失误描述",
      "originalMove": "原着法",
      "suggestedMove": "推荐着法",
      "reason": "原因解释（为什么这样走更好）"
    }
  ],
  "bestMoves": [
    {
      "move": 数字,
      "san": "着法",
      "reason": "为什么这一步好"
    }
  ],
  "openingInsight": "开局分析和建议",
  "todayLesson": "今日最重要的一条经验教训"
}

要求：
- 语气友好、鼓励，符合14岁青少年
- keyMistakes 最多3条，按严重程度排序
- bestMoves 最多2条
- 直接输出 JSON，不要加 markdown 格式`;
  }

  /**
   * 调用 LLM（模拟）
   */
  private async callLLM(prompt: string): Promise<ChessAnalystResult> {
    // TODO: 接真实 LLM (baoyu)
    // 暂时返回结构化 mock 数据

    await new Promise(resolve => setTimeout(resolve, 200)); // 模拟延迟

    return {
      summary: '这盘棋进攻凶猛，展现了不错的战术感觉，但中盘防守需要加强，注意保护自己的子力。',
      keyMistakes: [
        {
          move: 24,
          description: '象 d3 被抽',
          originalMove: 'Bd3',
          suggestedMove: 'Nf3',
          reason: '象在 d3 被黑方马跳吃，没有保护。建议走 Nf3 保护象并威胁反击。如果走 Nf3，对手不敢轻易吃象，因为有马e5的攻击机会。',
        },
        {
          move: 18,
          description: '兵 d4 送吃',
          originalMove: 'd4',
          suggestedMove: 'c3',
          reason: '兵冲到 d4 被对方象攻击，如果走 c3 可以保护 d4 兵，同时为白格象让出位置。',
        },
      ],
      bestMoves: [
        {
          move: 31,
          san: 'Qc6',
          reason: '皇后走到 c6 形成强烈威胁，既攻击 f7 兵，又威胁象，同时控制中央。对手无法同时防守两个威胁，是决定性的妙着！',
        },
      ],
      openingInsight: `${this.extractOpeningName(prompt)} 是一个经典开局，你选择了较为激进的变例。在业余对局中这个开局选择没问题，但要注意白方(你)在这个开局中需要保持进攻压力。`,
      todayLesson: '进攻时每走一步都要问自己：对手能不能吃我的子？特别是象和马这种价值较高的子，不要轻易送到对方子力攻击范围内。',
    };
  }

  private extractOpeningName(prompt: string): string {
    const match = prompt.match(/开局：(.+?)\n/);
    return match ? match[1] : '这个开局';
  }
}
