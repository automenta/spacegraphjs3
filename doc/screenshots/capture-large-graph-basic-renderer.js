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
    // Navigate to the large graph example
    await page.goto('http://localhost:5174/large-graph.html');
    
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
      path: path.join(process.cwd(), 'doc/screenshots/large-graph-basic-renderer.png'),
      fullPage: true 
    });
    
    console.log('Large graph with BasicRenderer screenshot saved to doc/screenshots/large-graph-basic-renderer.png');
    
    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    await browser.close();
  }
})();