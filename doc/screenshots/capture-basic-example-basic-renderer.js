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
    // Navigate to the basic example
    await page.goto('http://localhost:5174/');
    
    // Wait for the graph to load
    await page.waitForTimeout(3000);
    
    // Switch to BasicRenderer
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
    
    // Take a screenshot of the entire page with BasicRenderer
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/basic-example-basic-renderer.png'),
      fullPage: true 
    });
    
    console.log('Basic example with BasicRenderer screenshot saved to doc/screenshots/basic-example-basic-renderer.png');
    
    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    await browser.close();
  }
})();