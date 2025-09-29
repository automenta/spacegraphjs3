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
    // Navigate to our visual verification page
    // Assuming the dev server is running on port 5174 (default for Vite)
    await page.goto('http://localhost:5174/doc/screenshots/visual-verification.html');
    
    // Wait for the graph to load
    await page.waitForTimeout(3000);
    
    // Take a screenshot of the entire page
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/overview.png'),
      fullPage: true 
    });
    
    console.log('Overview screenshot saved to doc/screenshots/overview.png');
    
    // Take a close-up screenshot of the sphere nodes
    await page.evaluate(() => {
      // Zoom in on the red sphere node
      if (window.graph && window.graph.cameraPlugin) {
        window.graph.cameraPlugin.flyTo({
          target: { x: -10, y: 5, z: 0 },
          distance: 15
        }, { duration: 1000 });
      }
    });
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/sphere-nodes.png'),
      fullPage: true 
    });
    
    console.log('Sphere nodes screenshot saved to doc/screenshots/sphere-nodes.png');
    
    // Take a screenshot of the box nodes
    await page.evaluate(() => {
      // Zoom in on the yellow box node
      if (window.graph && window.graph.cameraPlugin) {
        window.graph.cameraPlugin.flyTo({
          target: { x: -10, y: -5, z: 0 },
          distance: 15
        }, { duration: 1000 });
      }
    });
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/box-nodes.png'),
      fullPage: true 
    });
    
    console.log('Box nodes screenshot saved to doc/screenshots/box-nodes.png');
    
    // Take a screenshot of the text nodes
    await page.evaluate(() => {
      // Zoom in on the cyan text node
      if (window.graph && window.graph.cameraPlugin) {
        window.graph.cameraPlugin.flyTo({
          target: { x: 10, y: -5, z: 0 },
          distance: 15
        }, { duration: 1000 });
      }
    });
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/text-nodes.png'),
      fullPage: true 
    });
    
    console.log('Text nodes screenshot saved to doc/screenshots/text-nodes.png');
    
    // Take a screenshot of the custom geometry nodes
    await page.evaluate(() => {
      // Zoom in on the orange custom node
      if (window.graph && window.graph.cameraPlugin) {
        window.graph.cameraPlugin.flyTo({
          target: { x: 0, y: 0, z: 10 },
          distance: 15
        }, { duration: 1000 });
      }
    });
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/custom-nodes.png'),
      fullPage: true 
    });
    
    console.log('Custom nodes screenshot saved to doc/screenshots/custom-nodes.png');
    
    // Take a screenshot showing curved edges
    await page.evaluate(() => {
      // Reset view to see all elements
      if (window.graph && window.graph.cameraPlugin) {
        window.graph.cameraPlugin.flyTo({
          target: { x: 0, y: 0, z: 0 },
          distance: 50
        }, { duration: 1000 });
      }
    });
    
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(process.cwd(), 'doc/screenshots/edges-curves.png'),
      fullPage: true 
    });
    
    console.log('Edges curves screenshot saved to doc/screenshots/edges-curves.png');
    
    // Close the browser
    await browser.close();
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    await browser.close();
  }
})();