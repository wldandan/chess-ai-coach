// Details Page - 显示复盘文本总结

const REVIEW_DATA_KEY = 'chess_coach_last_review';

interface ReviewResult {
  username: string;
  accuracy: number;
  blunders: number;
  brilliants: number;
  mistakes: number;
  xp: number;
  title: string;
  gameUrl?: string;
  // 详细分析数据
  overallAssessment?: string;
  strengths?: string[];
  weaknesses?: string[];
  keyMistakes?: Array<{ moveNumber: number; move: string; analysis: string }>;
  improvementTips?: string[];
  brilliantsList?: Array<{ moveNumber: number; move: string; analysis: string }>;
}

async function loadReviewData(): Promise<ReviewResult | null> {
  try {
    const result = await chrome.storage.local.get(REVIEW_DATA_KEY);
    return result[REVIEW_DATA_KEY] || null;
  } catch (err) {
    console.error('[Details] Failed to load review data:', err);
    return null;
  }
}

async function saveReviewData(data: ReviewResult): Promise<void> {
  await chrome.storage.local.set({ [REVIEW_DATA_KEY]: data });
}

function generateDetailedReview(result: ReviewResult): ReviewResult {
  // 生成模拟的详细分析数据
  const accuracy = result.accuracy;
  const isHighAccuracy = accuracy >= 85;
  const isMediumAccuracy = accuracy >= 70;

  const overallAssessment = isHighAccuracy
    ? `这盘棋整体表现优异！您的准确率达到了 ${accuracy.toFixed(1)}%，说明您对棋局的理解和判断都非常准确。在关键局面中，您做出了正确的选择，展现了良好的战术嗅觉。继续加油！`
    : isMediumAccuracy
    ? `这盘棋表现中规中矩，准确率为 ${accuracy.toFixed(1)}%。您在一些局面中表现不错，但在复杂战术情况下还有些犹豫。建议加强杀王战术的练习。`
    : `这盘棋的准确率为 ${accuracy.toFixed(1)}%，还有很大的提升空间。主要问题在于中局阶段的局面判断和战术识别。建议从基础开局重新学习。`;

  const strengths = [
    '开局准备充分，掌握多种常见开局变例',
    '残局技术扎实，子力配合协调',
    '空间感良好，中心控制得当',
    '战术敏锐度较高，能抓住对手失误',
  ];

  if (accuracy >= 85) {
    strengths.push('整体局面感出色，攻防转换时机把握精准');
  }

  const weaknesses = [
    '时间管理有待改进，有时在优势局面下思考过久',
    '对手送出的战术机会有时未能及时察觉',
    '残局收束阶段略显保守',
  ];

  if (accuracy < 85) {
    weaknesses.push('中局阶段局面判断需要加强');
    weaknesses.push('某些开局变例理解不够深入');
  }

  if (result.blunders > 2) {
    weaknesses.push('大失误偏多，需要提高全局观念');
  }

  const keyMistakes = [
    {
      moveNumber: 15,
      move: 'Nf3',
      analysis: `第15回合，您的马跳到f3看起来是自然的一步，但此时应该考虑用象牵制对手的防线。在类似局面中，保持子力活跃比单纯的位置优化更重要。建议多练习战术组合题来提高对这个局面的敏感度。`,
    },
    {
      moveNumber: 23,
      move: 'Qxd4',
      analysis: `第23回合的后车兑换值得商榷。虽然获得了子力优势，但简化后对手获得了不错的反击机会。在优势情况下，保持复杂局面往往比直接兑换更有利。`,
    },
  ];

  if (result.blunders >= 3) {
    keyMistakes.push({
      moveNumber: 31,
      move: 'O-O',
      analysis: `第31回合的王车易位时机选择有问题。此时对手后力集中在一侧，贸然易位会导致防线空虚。建议在易位前确认对手在后翼没有足够的进攻子力。`,
    });
  }

  const improvementTips = [
    '每天坚持做5-10道战术题，重点练习带将和得子的组合',
    '复盘时重点关注那些导致局势恶化的走法，思考是否有更好的选择',
    '学习1-2个主流开局的典型局面，理解每步棋背后的战略意图',
    '加强时间管理训练，避免在简单局面上浪费过多时间',
    '观看高水平棋手的对局，学习他们的局面判断方法',
  ];

  if (result.mistakes > 3) {
    improvementTips.push('建议使用棋谱分析工具，详细检查每一步的问题');
    improvementTips.push('可以尝试开启 chess.com 的分析模式，对每一步进行评估');
  }

  const brilliantsList = [
    {
      moveNumber: 18,
      move: 'Bxh7+',
      analysis: `第18回合象吃h7将军是精妙的弃子取势！通过弃去一象换得对手王城的巨大削弱，为后续进攻奠定基础。这是经典的战术组合，值得牢记。`,
    },
  ];

  if (result.brilliants >= 2) {
    brilliantsList.push({
      moveNumber: 27,
      move: 'Nf6+',
      analysis: `第27回合马跳f6将杀威胁非常精彩！利用马后炮的经典杀法，将对手的王困在不利位置。这需要出色的计算能力和对基本杀王模式的熟悉。`,
    });
  }

  return {
    ...result,
    overallAssessment,
    strengths,
    weaknesses,
    keyMistakes,
    improvementTips,
    brilliantsList,
  };
}

function showLoading() {
  document.getElementById('loading')!.style.display = 'flex';
  document.getElementById('content')!.style.display = 'none';
  document.getElementById('empty-state')!.style.display = 'none';
  document.getElementById('error')!.style.display = 'none';
}

function showContent(data: ReviewResult) {
  document.getElementById('loading')!.style.display = 'none';
  document.getElementById('content')!.style.display = 'block';
  document.getElementById('empty-state')!.style.display = 'none';
  document.getElementById('error')!.style.display = 'none';

  // 填充数据
  document.getElementById('username')!.textContent = `@${data.username}`;
  document.getElementById('title')!.textContent = data.title;
  document.getElementById('accuracy')!.textContent = `${data.accuracy.toFixed(1)}%`;
  document.getElementById('xp')!.textContent = `+${data.xp} XP`;

  // 整体评估
  document.getElementById('overall-assessment')!.textContent = data.overallAssessment || '';

  // 优势列表
  const strengthsEl = document.getElementById('strengths')!;
  strengthsEl.innerHTML = '';
  (data.strengths || []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    strengthsEl.appendChild(li);
  });

  // 薄弱列表
  const weaknessesEl = document.getElementById('weaknesses')!;
  weaknessesEl.innerHTML = '';
  (data.weaknesses || []).forEach(w => {
    const li = document.createElement('li');
    li.textContent = w;
    weaknessesEl.appendChild(li);
  });

  // 关键失误
  const mistakesEl = document.getElementById('mistakes')!;
  mistakesEl.innerHTML = '';
  (data.keyMistakes || []).forEach(m => {
    const div = document.createElement('div');
    div.className = 'mistake-item';
    div.innerHTML = `
      <div class="mistake-header">
        <span class="move-badge">第${m.moveNumber}回合</span>
        <span class="move-san">${m.move}</span>
      </div>
      <p class="mistake-analysis">${m.analysis}</p>
    `;
    mistakesEl.appendChild(div);
  });

  // 改进建议
  const tipsEl = document.getElementById('tips')!;
  tipsEl.innerHTML = '';
  (data.improvementTips || []).forEach(t => {
    const li = document.createElement('li');
    li.textContent = t;
    tipsEl.appendChild(li);
  });

  // 妙着
  const brilliantsSection = document.getElementById('brilliants-section')!;
  const brilliantsEl = document.getElementById('brilliants')!;
  if ((data.brilliantsList || []).length > 0) {
    brilliantsSection.style.display = 'block';
    brilliantsEl.innerHTML = '';
    (data.brilliantsList || []).forEach(b => {
      const div = document.createElement('div');
      div.className = 'brilliant-item';
      div.innerHTML = `
        <div class="brilliant-header">
          <span class="move-badge">第${b.moveNumber}回合</span>
          <span class="move-san brilliant-move">${b.move}</span>
        </div>
        <p class="brilliant-analysis">${b.analysis}</p>
      `;
      brilliantsEl.appendChild(div);
    });
  } else {
    brilliantsSection.style.display = 'none';
  }
}

function showEmpty() {
  document.getElementById('loading')!.style.display = 'none';
  document.getElementById('content')!.style.display = 'none';
  document.getElementById('empty-state')!.style.display = 'flex';
  document.getElementById('error')!.style.display = 'none';
}

function showError(message: string) {
  document.getElementById('loading')!.style.display = 'none';
  document.getElementById('content')!.style.display = 'none';
  document.getElementById('empty-state')!.style.display = 'none';
  document.getElementById('error')!.style.display = 'flex';
  document.getElementById('error-message')!.textContent = message;
}

// 初始化
async function init() {
  showLoading();

  try {
    let reviewData = await loadReviewData();

    // 如果没有详细数据，生成它
    if (reviewData) {
      if (!reviewData.overallAssessment) {
        reviewData = generateDetailedReview(reviewData);
        await saveReviewData(reviewData);
      }
      showContent(reviewData);
    } else {
      // 创建一个示例数据用于演示
      const demoData: ReviewResult = {
        username: 'aaronwang2026',
        accuracy: 82.5,
        blunders: 2,
        brilliants: 1,
        mistakes: 3,
        xp: 95,
        title: '战术高手',
      };
      const detailedDemo = generateDetailedReview(demoData);
      await saveReviewData(detailedDemo);
      showContent(detailedDemo);
    }
  } catch (err) {
    console.error('[Details] Init error:', err);
    showError('加载数据失败，请重试');
  }
}

// 返回按钮
document.getElementById('btn-back')?.addEventListener('click', () => {
  window.close();
});

// 重试按钮
document.getElementById('btn-retry')?.addEventListener('click', () => {
  init();
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);
