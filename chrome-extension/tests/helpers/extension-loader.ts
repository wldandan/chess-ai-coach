import { chromium, Browser, BrowserContext } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../output/chrome-mv3-dev');

let browser: Browser | null = null;

export async function getExtensionBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
  }
  return browser;
}

export async function getExtensionContext(): Promise<BrowserContext> {
  const browser = await getExtensionBrowser();
  const context = await browser.newContext();
  return context;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
