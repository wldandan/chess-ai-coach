# Chess Gamification Agent

## 职责
管理用户的 XP、等级、称号、成就系统。

## 数据模型
```typescript
interface UserProfile {
  userId: string;
  username: string;
  xp: number;
  level: number;
  titles: Title[];
  achievements: Achievement[];
  streak: number; // 连续复盘天数
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    brilliants: number;
    blunders: number;
  };
  radar: {
    opening: number;   // 开局 1-5
    middlegame: number; // 中盘 1-5
    endgame: number;   // 残局 1-5
    defense: number;   // 防守 1-5
    attack: number;    // 进攻 1-5
  };
}

interface Title {
  id: string;
  name: string;
  icon: string;
  unlockedAt: Date;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}
```

## XP 计算规则
```
基础 XP = 10
胜利加成 = +5
准确率 > 80% = +3
每发现 1 个妙着 = +2
每漏着 < 2 = +2
连续复盘 streak = +1/天 (最高+7)
```

## 称号系统
| 称号 | 条件 | 图标 |
|------|------|------|
| 初出茅庐 | 完成第 1 次复盘 | 🏅 |
| 漏着猎人 | 累计发现 10 个对手漏着 | 🔍 |
| 妙着大师 | 累计做出 5 个妙着 | ✨ |
| 连胜达人 | 累计赢得 10 局 | 🔥 |
| 棋王 | 达到 2000+ rating | 👑 |

## 等级系统
```
Level 1: 0-99 XP    (Chess Pupil)
Level 2: 100-299 XP (Chess Learner)
Level 3: 300-599 XP (Chess Player)
Level 4: 600-999 XP (Chess Specialist)
Level 5: 1000+ XP   (Chess Master)
```

## 雷达图计算
基于历史对局分析自动更新：
- 开局：前 10 步表现
- 中盘：第 10-25 步表现
- 残局：最后 15 步表现
- 防守：被将军时的应对质量
- 进攻：杀王机会把握

## 存储
使用 chrome.storage.local 持久化用户数据。
