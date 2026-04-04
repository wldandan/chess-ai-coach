/**
 * Reviewer Agent - 使用示例
 *
 * ```ts
 * import { generateReview, type GameInfo, type Analysis } from './agents';
 * import { createDefaultProfile } from './gamification';
 *
 * const gameInfo: GameInfo = {
 *   username: 'PlayerOne',
 *   opponent: 'Magnus',
 *   result: 'win',
 *   timeControl: '15+10',
 *   date: '2026-03-30',
 *   rating: 1650,
 *   opponentRating: 2850,
 * };
 *
 * const analysis: Analysis = {
 *   accuracy: 87.3,
 *   opening: 'Sicilian Defense',
 *   blunders: [
 *     { move: 24, san: 'Bd3', comment: '应该走Bc4保护中心', evalLoss: 120 },
 *   ],
 *   brilliants: [
 *     { move: 31, san: 'Qe6', comment: '绝妙的将军！直接锁定胜局', evalGain: 250 },
 *   ],
 *   phaseScores: { opening: 0.8, middlegame: 0.7, endgame: 0.9, defense: 0.6, attack: 0.85 },
 * };
 *
 * const profile = createDefaultProfile('user123', 'PlayerOne');
 *
 * // 同步模式（使用默认评语）
 * const review = await generateReview({ gameInfo, analysis, userProfile: profile });
 * console.log(review.markdown);
 *
 * // LLM 模式（使用 baoyu 生成趣味评语）
 * const reviewWithLLM = await generateReview({ gameInfo, analysis, userProfile: profile }, {
 *   async generate(prompt) {
 *     // 调用 baoyu LLM
 *     const response = await fetch('https://your-baoyu-endpoint/generate', {
 *       method: 'POST',
 *       body: JSON.stringify({ prompt }),
 *     });
 *     return (await response.json()).text;
 *   },
 * });
 * console.log(reviewWithLLM.markdown);
 * ```
 */
