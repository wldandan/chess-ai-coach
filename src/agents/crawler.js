/**
 * Chess Crawler Agent
 */

const https = require('https');

class ChessCrawlerAgent {
  constructor() {
    this.baseUrl = 'https://api.chess.com/pub/player';
  }

  async crawlUser(username, limit = 10) {
    console.log(`[Crawler] Fetching games for ${username}...`);

    try {
      const now = new Date();
      const games = [];

      for (let monthOffset = 0; monthOffset < 2 && games.length < limit; monthOffset++) {
        const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const url = `${this.baseUrl}/${username}/games/${year}/${month.toString().padStart(2, '0')}`;

        try {
          const data = await this.fetch(url);
          if (data && data.games) {
            const parsed = this.parseGames(data.games, username);
            games.push(...parsed);
          }
        } catch (e) {
          console.warn(`[Crawler] Failed to fetch ${url}:`, e.message);
        }
      }

      games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        username,
        games: games.slice(0, limit),
      };
    } catch (error) {
      console.error(`[Crawler] Error:`, error);
      return { username, games: [] };
    }
  }

  async getGame(gameId) {
    try {
      const url = `https://api.chess.com/pub/game/${gameId}`;
      const data = await this.fetch(url);
      return data.pgn || null;
    } catch (e) {
      console.error(`[Crawler] Failed to get game ${gameId}:`, e);
    }
    return null;
  }

  parseGames(games, username) {
    return games
      .filter(game => game.pgn)
      .map(game => {
        const white = game.white;
        const black = game.black;
        const isWhite = white.username && white.username.toLowerCase() === username.toLowerCase();
        const player = isWhite ? white : black;
        const opponent = isWhite ? black : white;

        let result = 'draw';
        if (game.rules === 'draw') result = 'draw';
        else if (player.result === 'win') result = 'win';
        else if (player.result === 'loss') result = 'lose';

        return {
          gameId: game.uuid || String(game.game_id),
          opponent: opponent.username || 'Unknown',
          result,
          timeControl: game.time_class || 'unknown',
          date: game.end_time ? new Date(game.end_time * 1000).toISOString().split('T')[0] : '',
          rating: player.rating,
          opponentRating: opponent.rating,
          url: game.url || `https://www.chess.com/game/live/${game.game_id}`,
          pgn: game.pgn,
        };
      });
  }

  fetch(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'ChessCoach/1.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }
}

module.exports = { ChessCrawlerAgent };
