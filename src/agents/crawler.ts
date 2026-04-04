/**
 * Crawler Agent - chess.com 对局抓取
 * 从 chess.com 抓取用户历史对局数据，提取 PGN 棋谱
 */

export interface GameInfo {
  game_id: string;
  username: string;
  opponent: string;
  time_control: string;
  result: 'win' | 'lose' | 'draw';
  rating: number;
  opponent_rating: number;
  pgn: string;
  url: string;
  timestamp: number;
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  start_time: number;
  end_time?: number;
  rated: boolean;
  fen?: string;
  time_class?: string;
  rules?: string;
  white: {
    rating: number;
    result: string;
    username: string;
    uuid?: string;
  };
  black: {
    rating: number;
    result: string;
    username: string;
    uuid?: string;
  };
}

export interface ChessComGamesResponse {
  games: ChessComGame[];
}

/**
 * 获取用户的最近对局列表
 * @param username chess.com 用户名
 * @param limit 返回对局数量上限 (默认 10)
 */
export async function getUserGames(username: string, limit: number = 10): Promise<GameInfo[]> {
  const encodedUsername = username.toLowerCase().trim();
  const url = `https://api.chess.com/pub/player/${encodedUsername}/games`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'chess-reviews/1.0 (chess.com crawler)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`User not found: ${username}`);
        return [];
      }
      if (response.status === 429) {
        console.error('API rate limit exceeded');
        return [];
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data: ChessComGamesResponse = await response.json();

    if (!data.games || data.games.length === 0) {
      return [];
    }

    // 取最新的 limit 局 (数组已按时间倒序)
    const games = data.games.slice(0, limit);

    return games.map((game) => parseGameInfo(game, encodedUsername));
  } catch (error) {
    console.error(`Failed to fetch games for ${username}:`, error);
    return [];
  }
}

/**
 * 获取单局对局的 PGN
 * @param game_id 对局 ID
 */
export async function getGamePGN(game_id: string | number): Promise<string | null> {
  const url = `https://api.chess.com/pub/game/${game_id}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'chess-reviews/1.0 (chess.com crawler)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`Game not found: ${game_id}`);
        return null;
      }
      if (response.status === 429) {
        console.error('API rate limit exceeded');
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const game: ChessComGame = await response.json();

    // 验证 PGN 存在
    if (!game.pgn) {
      console.error(`No PGN available for game ${game_id}`);
      return null;
    }

    return game.pgn;
  } catch (error) {
    console.error(`Failed to fetch game ${game_id}:`, error);
    return null;
  }
}

/**
 * 解析 chess.com API 返回的对局数据
 */
function parseGameInfo(game: ChessComGame, targetUsername: string): GameInfo {
  // 判断用户执白还是执黑
  const isWhite = game.white.username.toLowerCase() === targetUsername;
  const userColor = isWhite ? game.white : game.black;
  const opponentColor = isWhite ? game.black : game.white;

  // 解析结果
  let result: 'win' | 'lose' | 'draw' = 'draw';
  if (userColor.result === 'win') {
    result = 'win';
  } else if (userColor.result === 'lose') {
    result = 'lose';
  }

  // 从 PGN 提取时间戳（如果 start_time 不可用）
  const timestamp = game.end_time || game.start_time;

  return {
    game_id: extractGameId(game.url),
    username: targetUsername,
    opponent: opponentColor.username,
    time_control: game.time_control || 'unknown',
    result,
    rating: userColor.rating,
    opponent_rating: opponentColor.rating,
    pgn: game.pgn || '',
    url: game.url,
    timestamp,
  };
}

/**
 * 从 chess.com URL 提取对局 ID
 */
function extractGameId(url: string): string {
  // URL 格式: https://www.chess.com/game/live/123456789
  const match = url.match(/\/game\/(?:live|chess\.com)\/(\d+)/);
  return match ? match[1] : url;
}

export default {
  getUserGames,
  getGamePGN,
};
