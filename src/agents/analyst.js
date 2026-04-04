/**
 * Chess Analyst Agent
 */

class ChessAnalystAgent {
  async review(input) {
    console.log(`[Analyst] Reviewing game...`);
    const { accuracy, blunders, brilliants, opening } = input;

    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      summary: '这盘棋进攻凶猛，展现了不错的战术感觉，但中盘防守需要加强，注意保护自己的子力。',
      keyMistakes: blunders.slice(0, 2).map(b => ({
        move: b.move,
        description: `${b.san} 这步有问题`,
        originalMove: b.san,
        suggestedMove: b.bestMove || 'Nf3',
        reason: `${b.san} 被对手轻易吃掉或将军，建议走 ${b.bestMove || 'Nf3'} 保护子力并保持进攻压力。`,
      })),
      bestMoves: brilliants.slice(0, 1).map(b => ({
        move: b.move,
        san: b.san,
        reason: `${b.san} 是一个决定性的妙着！皇后走到这个位置形成多重威胁，对手无法同时防守。`,
      })),
      openingInsight: `${opening || '这个开局'} 是一个经典开局选择，你选择了较为激进的变例。业余对局中这个开局没问题，但要注意保持进攻压力的同时不丢子。`,
      todayLesson: '进攻时每走一步都要问自己：对手能不能吃我的子？特别是象和马，不要轻易送到对方子力攻击范围内。',
    };
  }
}

module.exports = { ChessAnalystAgent };
