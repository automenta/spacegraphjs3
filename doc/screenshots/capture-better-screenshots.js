import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

(async () => {
  // Create screenshots directory if it doesn't exist
  await fs.mkdir(path.join(process.cwd(), 'doc/screenshots'), { recursive: true });

  // Launch the browser
  const browser = await chromium.launch({ headless: false }); // Not headless so we can see what's happening
  const page = await browser.newPage();

  try {
    // Set viewport to a reasonable size
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // Navigate to the comprehensive demo
    await page.goto('http://localhost:5174/examples/comprehensive-demo.html');
    
    // Wait for the graph to load and render
    await page.waitForTimeout(5000);
    
    // Wait for Three.js to render the scene
    await page.waitForFunction(() => {
      // Check if there are elements rendered in the scene
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    }, { timeout: 10000 });
    
    // Wait a bit more for the layout to stabilize
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the entire page
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/comprehensive-demo.png'),
      fullPage: true 
    });
    
    console.log('Comprehensive demo screenshot saved to doc/screenshots/comprehensive-demo.png');
    
    // Take a close-up screenshot of a specific area
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/comprehensive-demo-closeup.png'),
      clip: { x: 300, y: 200, width: 600, height: 400 }
    });
    
    console.log('Close-up screenshot saved to doc/screenshots/comprehensive-demo-closeup.png');
    
    // Try different layouts
    const layoutButtons = await page.$$('.layout-buttons button');
    if (layoutButtons.length > 0) {
      // Click the second layout button (grid layout)
      await layoutButtons[1].click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: path.join(process.cwd(), 'doc/screenshots/grid-layout.png'),
        fullPage: true 
      });
      
      console.log('Grid layout screenshot saved to doc/screenshots/grid-layout.png');
    }
    
    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    await browser.close();
  }
})();