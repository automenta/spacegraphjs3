#!/usr/bin/env node

/**
 * Unified Screenshot Generator for SpaceGraphJS Documentation
 *
 * This script generates up-to-date screenshots for all examples
 * and saves them to docs/screenshots/ for documentation purposes.
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXAMPLES = [
  { name: 'element-actors-demo', path: 'examples/element-actors-demo.html', description: 'Different element actor types (spheres, boxes, text)' },
  { name: 'edge-interaction', path: 'examples/edge-interaction.html', description: 'Interactive edge demonstrations' },
  { name: 'layout-engines-demo', path: 'examples/layout-engines-demo.html', description: 'Various layout algorithms' },
  { name: 'performance-optimizations', path: 'examples/performance-optimizations.html', description: 'Performance optimization demos' },
  { name: 'comprehensive-demo', path: 'examples/comprehensive-demo.html', description: 'All features combined' },
  { name: 'large-graph', path: 'examples/large-graph.html', description: 'Performance test with many nodes' },
  { name: 'html-node-demo', path: 'examples/html-node-demo.html', description: 'HTML nodes in graphs' },
];

const OUTPUT_DIR = path.join(__dirname, 'screenshots');

/**
 * Initialize browser and page for screenshot capture
 */
async function initBrowser() {
  console.log('🚀 Initializing browser...');

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 800 });

  return { browser, page };
}

/**
 * Navigate to a URL and wait for the graph to load
 */
async function navigateAndLoad(page: any, url: string, timeout = 15000) {
  console.log(`📄 Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for graph to initialize
  try {
    await page.waitForFunction(() => {
      return (window as any).graph;
    }, { timeout });
  } catch {
    console.log(`⚠️  Warning: Graph not detected on ${url}, continuing anyway...`);
  }

  // Additional wait for rendering
  await page.waitForTimeout(3000);
}

/**
 * Take a screenshot and save it to the output directory
 */
async function captureScreenshot(page: any, filename: string, options = {}) {
  const fullPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({
    path: fullPath,
    fullPage: true,
    ...options,
  });
  console.log(`📸 Screenshot saved: ${filename}`);
}

/**
 * Generate screenshots for all examples
 */
async function generateScreenshots() {
  const { browser, page } = await initBrowser();

  try {
    console.log('🎯 Starting screenshot generation...\n');

    for (const example of EXAMPLES) {
      try {
        console.log(`\n📋 Processing ${example.name}: ${example.description}`);

        // Navigate to example
        await navigateAndLoad(page, `http://localhost:5174/${example.path}`);

        // Capture base screenshot
        await captureScreenshot(page, `${example.name}.png`);

        // For interactive examples, capture additional states
        if (example.name.includes('element-actors') || example.name.includes('edge-interaction')) {
          // Try to capture hover state
          try {
            await page.hover('canvas', { timeout: 1000 });
            await page.waitForTimeout(500);
            await captureScreenshot(page, `${example.name}-hover.png`);
          } catch {
            console.log(`   ⚠️  Could not capture hover state for ${example.name}`);
          }

          // Try to capture selection state
          try {
            await page.click('canvas', { timeout: 1000 });
            await page.waitForTimeout(500);
            await captureScreenshot(page, `${example.name}-selected.png`);
          } catch {
            console.log(`   ⚠️  Could not capture selection state for ${example.name}`);
          }
        }

        console.log(`✅ Completed ${example.name}`);

      } catch (error: any) {
        console.error(`❌ Failed to process ${example.name}:`, error.message);
      }
    }

    console.log('\n🎉 Screenshot generation completed!');
    console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);

  } finally {
    await browser.close();
  }
}

/**
 * Check if dev server is running
 */
async function checkDevServer(port = 5174) {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  SpaceGraphJS Screenshot Generator');
  console.log('=====================================\n');

  // Check if dev server is running
  const isRunning = await checkDevServer();
  if (!isRunning) {
    console.error('❌ Development server is not running!');
    console.log('💡 Please start the dev server first:');
    console.log('   npm run dev');
    process.exit(1);
  }

  try {
    await generateScreenshots();
  } catch (_error) {
    console.error('💥 Error during screenshot generation:', _error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateScreenshots, initBrowser, navigateAndLoad, captureScreenshot };