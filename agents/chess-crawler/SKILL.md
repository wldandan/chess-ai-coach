# Chess Crawler Agent

## 职责
从 chess.com 抓取用户历史对局数据，提取 PGN 棋谱。

## 能力
- 输入用户名，获取最近 N 局对局列表
- 获取指定对局的完整 PGN
- 处理认证（cookie/API token）
- 解析 chess.com 的存档格式

## API 端点
```
GET https://api.chess.com/pub/player/{username}/games
GET https://api.chess.com/pub/player/{username}/games/{year}/{month}
GET https://api.chess.com/pub/game/{game_id}
```

## 输出格式
```json
{
  "game_id": "abc123",
  "username": "player_name",
  "opponent": "Magnus",
  "time_control": "15+10",
  "result": "win|lose|draw",
  "rating": 1500,
  "opponent_rating": 2800,
  "pgn": "(完整PGN字符串)",
  "url": "https://www.chess.com/game/live/xxx",
  "timestamp": 1743360000
}
```

## 错误处理
- 用户不存在 → 返回空数组 + 提示
- API 限流 → 等待重试
- 无对局数据 → 返回空数组
