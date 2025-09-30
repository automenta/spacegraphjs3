import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

(async () => {
  // Create screenshots directory if it doesn't exist
  await fs.mkdir(path.join(process.cwd(), 'doc/screenshots'), { recursive: true });

  // Launch the browser
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to our comprehensive basic renderer test page
    await page.goto('http://localhost:5174/comprehensive-basic-renderer-test.html');
    
    // Wait for the graph to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the entire page with BasicRenderer
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/comprehensive-basic-renderer-test.png'),
      fullPage: true 
    });
    
    console.log('Comprehensive BasicRenderer test screenshot saved to doc/screenshots/comprehensive-basic-renderer-test.png');
    
    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    await browser.close();
  }
})();