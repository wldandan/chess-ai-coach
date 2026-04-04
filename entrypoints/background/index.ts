export default defineBackground({
  type: 'module',
  persistent: false,

  main() {
    console.log('[Chess Coach] Background service worker started');

    // Handle messages from popup and content scripts
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleMessage(message)
        .then(sendResponse)
        .catch((err) => {
          console.error('[Chess Coach] Message error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // Keep channel open for async response
    });

    // Handle extension icon click (when no popup is defined)
    browser.action.onClicked.addListener((tab) => {
      console.log('[Chess Coach] Extension icon clicked on tab:', tab.id);
    });
  },
});

interface Message {
  action: string;
  username?: string;
  gameData?: any;
}

interface AgentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function handleMessage(message: Message): Promise<AgentResponse> {
  const { action } = message;

  switch (action) {
    case 'analyzeGame':
      return handleAnalyzeGame(message.username!);

    case 'processGameAnalysis':
      return handleProcessGameAnalysis(message.gameData!, message.username!);

    case 'openPopup':
      return { success: true };

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}

async function handleAnalyzeGame(username: string): Promise<AgentResponse> {
  try {
    // Try fetching real games first
    const games = await fetchUserGames(username);
    
    if (games.length > 0) {
      const latestGame = games[0];
      return await handleProcessGameAnalysis(latestGame, username);
    }

    // Fallback to mock data for demo
    console.log('[Chess Coach] No real games found, using mock data');
    return await handleMockAnalysis(username);
  } catch (error: any) {
    console.error('[Chess Coach] Analyze game error:', error);
    // Fallback to mock on any error
    return await handleMockAnalysis(username);
  }
}

async function handleMockAnalysis(username: string): Promise<AgentResponse> {
  // Simulate some delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));

  const mockPGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.03.30"]
[White "${username}"]
[Black "MagnusCarlsen"]
[Result "1-0"]
[WhiteElo "1523"]
[BlackElo "2847"]
[TimeControl "900+10"]
[Termination "${username} won by checkmate"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8 14. Ng3 g6 15. a4 c5 16. d5 c4 17. b4 Nh5 18. Nxh5 gxh5 19. Qd2 h6 20. Bf5 Nf6 21. Rf1 Kg7 22. Qe3 Rh8 23. Qf3 Be7 24. Bc2 Bf8 25. g3 Be7 26. Kg2 Bd8 27. Qe3 Be7 28. Rh1 Qd7 29. h4 Rag8 30. Rh3 Qa7 31. Qd2 Qxd4 32. cxd4 exd4 33. e5 dxe5 34. Nxe5 Bd5 35. Qf4 Bxe5 36. Qxe5+ Kh7 37. Bf5+ Kg7 38. Qf6+ Kh7 39. Bg6+ Kxg6 40. Qf7+ Kh6 41. Rhg3 Rg7 42. Qf8+ Rg8 43. Qxf6+ Kh5 44. g4+ Kh4 45. Qh6# 1-0`;

  const mockAnalysis = {
    accuracy: 87.3,
    blunders: [{ move: 24, san: 'Bd3', comment: '这步象有点浪，下一步直接被抽了！', evalLoss: 120 }],
    brilliants: [{ move: 31, san: 'Qxd4', comment: '皇后偷杀！对面直接原地裂开 😎', evalGain: 250 }],
    mistakes: [{ move: 19, san: 'h5', comment: '兵被吃了，但这步也有道理', evalLoss: 45 }],
  };

  const rewards = calculateRewards(mockAnalysis);

  return {
    success: true,
    data: {
      username,
      accuracy: mockAnalysis.accuracy,
      blunders: mockAnalysis.blunders,
      brilliants: mockAnalysis.brilliants,
      mistakes: mockAnalysis.mistakes,
      xp: rewards.xp,
      title: rewards.title,
      gameUrl: 'https://www.chess.com/game/live/mock-demo',
      pgn: mockPGN,
    },
  };
}

async function handleProcessGameAnalysis(gameData: any, username: string): Promise<AgentResponse> {
  try {
    // Extract PGN and game info
    const { pgn, white, black, result, opening, url } = gameData;

    if (!pgn) {
      return { success: false, error: '无法获取对局数据' };
    }

    // Call OpenClaw Agent for analysis (placeholder - actual implementation would use agent SDK)
    const analysis = await callAnalysisAgent(pgn, username);

    // Calculate gamification rewards
    const rewards = calculateRewards(analysis);

    return {
      success: true,
      data: {
        username,
        accuracy: analysis.accuracy,
        blunders: analysis.blunders,
        brilliants: analysis.brilliants,
        mistakes: analysis.mistakes,
        xp: rewards.xp,
        title: rewards.title,
        gameUrl: url,
      },
    };
  } catch (error: any) {
    console.error('[Chess Coach] Process game error:', error);
    return { success: false, error: error.message };
  }
}

async function fetchUserGames(username: string): Promise<any[]> {
  // Fetch from chess.com API
  try {
    const response = await fetch(
      `https://api.chess.com/pub/player/${username}/games?limit=1`,
      { headers: { 'User-Agent': 'ChessCoach/1.0' } }
    );
    
    if (!response.ok) {
      throw new Error(`Chess.com API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.games || [];
  } catch (error) {
    console.error('[Chess Coach] Fetch games error:', error);
    return [];
  }
}

async function callAnalysisAgent(pgn: string, username: string): Promise<any> {
  // Placeholder for actual OpenClaw Agent integration
  // In production, this would call the orchestrator agent
  // For now, return demo data with realistic variations
  
  // Simulate analysis delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate somewhat realistic demo data
  const baseAccuracy = 65 + Math.random() * 30; // 65-95%
  const blunders = Math.floor(Math.random() * 4);
  const mistakes = Math.floor(Math.random() * 5);
  const brilliants = Math.floor(Math.random() * 3);

  return {
    accuracy: Math.round(baseAccuracy * 10) / 10,
    blunders,
    mistakes,
    brilliants,
  };
}

function calculateRewards(analysis: any): { xp: number; title: string } {
  const { accuracy, blunders, brilliants } = analysis;

  // XP calculation based on performance
  let xp = 50; // Base XP
  xp += Math.round(accuracy * 0.5); // Accuracy bonus
  xp += brilliants * 15; // Brilliant move bonus
  xp -= blunders * 10; // Blunder penalty
  xp = Math.max(0, xp); // Floor at 0

  // Title based on accuracy
  let title = '初出茅庐';
  if (accuracy >= 95) title = '棋王';
  else if (accuracy >= 90) title = '大师之路';
  else if (accuracy >= 85) title = '战术高手';
  else if (accuracy >= 80) title = '棋坛新秀';
  else if (accuracy >= 75) title = '战术新星';
  else if (accuracy >= 70) title = '初出茅庐';

  return { xp, title };
}
