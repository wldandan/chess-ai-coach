# Chess Engine Agent

## 职责
使用 Stockfish 引擎分析 PGN，识别漏着与妙着。

## 输入
- PGN 棋谱字符串
- 分析深度配置（默认 depth=15）

## 能力
- 将 PGN 转换为 FEN 局面
- Stockfish WASM 引擎集成
- 评估每步棋的优劣
- 识别漏着（对手失误）和妙着（你的好棋）

## 漏着/妙着判定标准
```
漏着 (Blunder): 评估差 > 0.5 → 对手失误
妙着 (Brilliant): 评估差 > 0.8 → 我的好棋
普通: -0.5 ~ 0.5
```

## 输出格式
```json
{
  "game_id": "abc123",
  "total_moves": 68,
  "accuracy": 82.5,
  "blunders": [
    {
      "move_number": 24,
      "side": "white",
      "fen": "rnbqkb...p...",
      "move": "Bxd3",
      "evaluation_before": 0.3,
      "evaluation_after": -0.9,
      "best_move": "Nf2",
      "delta": -1.2,
      "comment": "象被抽了！对面笑开花"
    }
  ],
  "brilliants": [
    {
      "move_number": 31,
      "side": "white",
      "fen": "...",
      "move": "Qc6",
      "evaluation_before": -0.2,
      "evaluation_after": 2.3,
      "best_move": "Qc6",
      "delta": 2.5,
      "comment": "皇后偷杀！对面直接懵了 😎"
    }
  ],
  "overall_comment": "进攻凶猛，但防守需加强"
}
```

## 技术方案
- Stockfish.js (WASM 版本) 在浏览器运行
- chess.js 解析 PGN → FEN
- Web Worker 避免 UI 阻塞
