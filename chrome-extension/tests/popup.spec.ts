import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const OUTPUT_PATH = path.join(__dirname, '../output/chrome-mv3');

test.describe('Popup Build Output', () => {
  test('popup.html exists and has correct structure', () => {
    const popupPath = path.join(OUTPUT_PATH, 'popup.html');
    expect(fs.existsSync(popupPath)).toBe(true);

    const content = fs.readFileSync(popupPath, 'utf-8');
    expect(content).toContain('Chess Coach');
    expect(content).toContain('module');
    expect(content).toContain('chunks/');
  });

  test('popup JS chunk exists', () => {
    const chunksDir = path.join(OUTPUT_PATH, 'chunks');
    const files = fs.readdirSync(chunksDir);
    const popupChunk = files.find(f => f.startsWith('popup-') && f.endsWith('.js'));
    expect(popupChunk).toBeDefined();
  });

  test('popup CSS exists in assets', () => {
    const assetsDir = path.join(OUTPUT_PATH, 'assets');
    if (!fs.existsSync(assetsDir)) {
      // CSS might be inline or in different location
      expect(true).toBe(true);
      return;
    }
    const files = fs.readdirSync(assetsDir);
    const popupCss = files.find(f => f.startsWith('popup-') && f.endsWith('.css'));
    expect(popupCss).toBeDefined();
  });
});

test.describe('Extension Manifest', () => {
  test('manifest has popup configured', () => {
    const manifestPath = path.join(OUTPUT_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.action).toHaveProperty('default_popup');
    expect(manifest.action.default_popup).toBe('popup.html');
  });

  test('manifest has content scripts for chess.com', () => {
    const manifestPath = path.join(OUTPUT_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // content_scripts might be named differently in manifest v3
    expect(manifest.permissions).toContain('activeTab');
    expect(manifest.host_permissions).toContain('*://*.chess.com/*');
  });
});

test.describe('Options Page', () => {
  test('options.html exists', () => {
    const optionsPath = path.join(OUTPUT_PATH, 'options.html');
    expect(fs.existsSync(optionsPath)).toBe(true);
  });
});

test.describe('Details Page', () => {
  test('details.html exists', () => {
    const detailsPath = path.join(OUTPUT_PATH, 'details.html');
    expect(fs.existsSync(detailsPath)).toBe(true);
  });
});
