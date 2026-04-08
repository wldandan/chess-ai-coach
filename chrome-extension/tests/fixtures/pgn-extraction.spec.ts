/**
 * PGN Extraction Tests using Mock HTML
 *
 * Tests content script PGN extraction on a simulated chess.com game page
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const FIXTURE_PATH = path.join(__dirname, '../fixtures/chesscom-game-mock.html');
const CONTENT_SCRIPT_PATH = path.join(__dirname, '../../output/chrome-mv3/content-scripts/content.js');

test.describe('PGN Extraction', () => {

  test('extracts PGN from data-pgn attribute', async ({ page }) => {
    await page.goto(`file://${FIXTURE_PATH}`);

    // Inject content script
    await page.addScriptTag({ path: CONTENT_SCRIPT_PATH });
    await page.waitForTimeout(500);

    // Test data-pgn attribute extraction (main method)
    const pgn = await page.evaluate(() => {
      const board = document.querySelector('[data-pgn]') as HTMLElement;
      return board?.dataset.pgn || null;
    });

    expect(pgn).toBeTruthy();
    expect(pgn).toContain('1.');
    expect(pgn).toContain('e4');
    console.log('Data-pgn extracted:', pgn?.substring(0, 50) + '...');
  });

  test('extracts PGN from meta tag', async ({ page }) => {
    await page.goto(`file://${FIXTURE_PATH}`);

    // Test meta tag extraction
    const pgn = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="pgn"]') as HTMLMetaElement;
      return meta?.content ? decodeURIComponent(meta.content) : null;
    });

    expect(pgn).toBeTruthy();
    expect(pgn).toContain('e4');
    expect(pgn).toContain('Nf3');
    console.log('Meta PGN extracted:', pgn?.substring(0, 50) + '...');
  });

  test('extracts PGN from embedded script (window.pgnData)', async ({ page }) => {
    await page.goto(`file://${FIXTURE_PATH}`);

    // Test window.pgnData extraction
    const pgn = await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      if (win.pgnData && typeof win.pgnData === 'object') {
        return (win.pgnData as { pgn: string }).pgn;
      }
      return null;
    });

    expect(pgn).toBeTruthy();
    expect(pgn).toContain('e4');
    console.log('Script PGN extracted:', pgn?.substring(0, 50) + '...');
  });

  test('extracts PGN from window.__NUXT__', async ({ page }) => {
    await page.goto(`file://${FIXTURE_PATH}`);

    // Test __NUXT__ extraction
    const pgn = await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>;
      if (win.__NUXT__ && typeof win.__NUXT__ === 'object') {
        const nuxtStr = JSON.stringify(win.__NUXT__);
        const match = nuxtStr.match(/"pgn"\s*:\s*"([^"]+)"/);
        if (match) {
          return decodeURIComponent(match[1].replace(/\\n/g, '\n'));
        }
      }
      return null;
    });

    expect(pgn).toBeTruthy();
    expect(pgn).toContain('e4');
    console.log('NUXT PGN extracted:', pgn?.substring(0, 50) + '...');
  });

  test('verifies fixture has valid PGN data', async ({ page }) => {
    await page.goto(`file://${FIXTURE_PATH}`);

    // Verify the fixture itself has correct data
    const hasData = await page.evaluate(() => {
      const board = document.querySelector('[data-pgn]') as HTMLElement;
      const meta = document.querySelector('meta[name="pgn"]') as HTMLMetaElement;
      return {
        hasDataPgn: !!board?.dataset.pgn,
        hasMetaPgn: !!meta?.content,
        title: document.title,
      };
    });

    expect(hasData.title).toContain('Chess.com');
    expect(hasData.hasDataPgn).toBe(true);
    expect(hasData.hasMetaPgn).toBe(true);
  });

});
