/**
 * Chess Reviewer Agent
 */

class ChessReviewerAgent {
  async generate(input) {
    console.log(`[Reviewer] Generating review card...`);
    const { gameInfo, analysis } = input;

    const funnyComment = this.generateFunnyComment(gameInfo.result, analysis.accuracy);
    const markdown = this.buildMarkdown(gameInfo, analysis, funnyComment);
    const html = this.markdownToHtml(markdown);

    return { markdown, html, funnyComment };
  }

  generateFunnyComment(result, accuracy) {
    if (result === 'win') {
      if (accuracy >= 90) return '这盘棋下得太帅了！简直是天选之人，对手都被你的王霸之气震慑到了！✨';
      if (accuracy >= 80) return '漂亮！虽然中间有点小波折，但最后还是完美收官！继续保持这个状态！🔥';
      return '赢就是赢！虽然有些地方还可以更好，但最重要的是——你赢了！下次继续冲！💪';
    }
    if (result === 'lose') {
      return '输一盘不算什么！每个大师都是从输棋开始的，重要的是学到东西，下次复仇！😤';
    }
    return '平局也是一种艺术！说明你和对手势均力敌，下次再战！🤝';
  }

  buildMarkdown(gameInfo, analysis, funnyComment) {
    const resultEmoji = gameInfo.result === 'win' ? '🏆' : gameInfo.result === 'lose' ? '😢' : '🤝';
    const resultText = gameInfo.result === 'win' ? '胜利' : gameInfo.result === 'lose' ? '失败' : '平局';

    const worstBlunder = analysis.blunders && analysis.blunders[0];
    const bestBrilliant = analysis.brilliants && analysis.brilliants[0];

    let md = `${resultEmoji} 对局复盘：vs ${gameInfo.opponent} (${gameInfo.timeControl})\n\n`;
    md += `🏆 结果：${resultText}！\n\n`;
    md += `⭐ 准确率：${analysis.accuracy}%\n`;

    if (worstBlunder) {
      md += `🔴 漏着：第${worstBlunder.move}步 - ${worstBlunder.san} ❌\n`;
      md += `   "${worstBlunder.comment}"\n\n`;
    }
    if (bestBrilliant) {
      md += `🟡 妙着：第${bestBrilliant.move}步 - ${bestBrilliant.san} ✨\n`;
      md += `   "${bestBrilliant.comment}"\n\n`;
    }

    md += `💬 ${funnyComment}\n`;

    return md;
  }

  markdownToHtml(md) {
    return md
      .split('\n')
      .map(line => {
        if (line.startsWith('🏆') || line.startsWith('⭐') || line.startsWith('🔴') ||
            line.startsWith('🟡') || line.startsWith('💬') || line.startsWith('⚔️')) {
          return `<p class="review-line">${line}</p>`;
        }
        if (line.trim()) return `<span class="review-inline">${line}</span><br>`;
        return '<br>';
      })
      .join('');
  }
}

module.exports = { ChessReviewerAgent };
