import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

/**
 * Initialize browser and page for screenshot capture
 * @returns {Promise<{browser: Browser, page: Page}>}
 */
export async function initBrowser() {
  // Create screenshots directory if it doesn't exist
  await fs.mkdir(path.join(process.cwd(), 'doc/screenshots'), { recursive: true });

  // Launch the browser
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  return { browser, page };
}

/**
 * Navigate to a URL and wait for the graph to load
 * @param {Page} page - Playwright page instance
 * @param {string} url - URL to navigate to
 * @param {number} timeout - Timeout in milliseconds (default: 3000)
 */
export async function navigateAndLoad(page, url, timeout = 3000) {
  await page.goto(url);
  await page.waitForTimeout(timeout);
}

/**
 * Take a screenshot and save it to file
 * @param {Page} page - Playwright page instance
 * @param {string} filename - Filename to save screenshot as
 * @param {Object} options - Additional screenshot options
 */
export async function captureScreenshot(page, filename, options = {}) {
  const fullPath = path.join(process.cwd(), 'doc/screenshots', filename);
  await page.screenshot({ 
    path: fullPath,
    fullPage: true,
    ...options
  });
  console.log(`Screenshot saved to ${fullPath}`);
}

/**
 * Execute a camera movement and wait for animation
 * @param {Page} page - Playwright page instance
 * @param {Object} cameraParams - Camera parameters
 * @param {number} timeout - Timeout in milliseconds (default: 2000)
 */
export async function moveCamera(page, cameraParams, timeout = 2000) {
  await page.evaluate((params) => {
    if (window.graph && window.graph.cameraPlugin) {
      window.graph.cameraPlugin.flyTo(params.target, { 
        duration: params.duration || 1000,
        ...params.options
      });
    }
  }, cameraParams);
  
  await page.waitForTimeout(timeout);
}

/**
 * Switch to BasicRenderer
 * @param {Page} page - Playwright page instance
 */
export async function switchToBasicRenderer(page) {
  await page.evaluate(() => {
    if (window.graph) {
      window.graph.update({
        performance: {
          useBasicRenderer: true
        }
      });
    }
  });
  
  // Wait for the renderer to switch
  await page.waitForTimeout(2000);
}

/**
 * Close browser and handle errors
 * @param {Browser} browser - Playwright browser instance
 */
export async function closeBrowser(browser) {
  try {
    await browser.close();
  } catch (error) {
    console.error('Error closing browser:', error);
  }
}