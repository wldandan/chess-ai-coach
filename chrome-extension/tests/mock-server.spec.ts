import { test, expect } from '@playwright/test';

const MOCK_SERVER_URL = 'http://localhost:18889';

async function apiRequest(path: string, body?: object) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    ok: () => response.ok,
    status: response.status,
    json: async () => response.json(),
  };
}

test.describe('Mock Server API', () => {
  test('health check returns ok', async () => {
    const response = await apiRequest(`${MOCK_SERVER_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('analyze action returns valid data', async () => {
    const response = await apiRequest(`${MOCK_SERVER_URL}/api/chess-coach`, {
      action: 'analyze',
      pgn: '1.e4 e5 2.Nf3 Nc6 3.Bb5',
      userId: 'test_user'
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('accuracy');
    expect(body.data).toHaveProperty('blunders');
    expect(body.data).toHaveProperty('brilliants');
    expect(body.data).toHaveProperty('mistakes');
    expect(body.data).toHaveProperty('xp');
    expect(body.data).toHaveProperty('title');
  });

  test('crawl_user action returns game list', async () => {
    const response = await apiRequest(`${MOCK_SERVER_URL}/api/chess-coach`, {
      action: 'crawl_user',
      username: 'test_user',
      limit: 5
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('games');
    expect(Array.isArray(body.data.games)).toBe(true);
    expect(body.data.games.length).toBeLessThanOrEqual(5);
  });

  test('full_review action returns complete analysis', async () => {
    const response = await apiRequest(`${MOCK_SERVER_URL}/api/chess-coach`, {
      action: 'full_review',
      pgn: '1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6',
      userId: 'test_user',
      username: 'test_user'
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('gameInfo');
    expect(body.data).toHaveProperty('analysis');
    expect(body.data).toHaveProperty('review');
    expect(body.data).toHaveProperty('gamification');
    expect(body.data).toHaveProperty('chessAnalyst');
  });

  test('unknown action returns error', async () => {
    const response = await apiRequest(`${MOCK_SERVER_URL}/api/chess-coach`, {
      action: 'unknown_action'
    });

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Unknown action');
  });
});
