import { initBrowser, navigateAndLoad, captureScreenshot, moveCamera, closeBrowser } from './screenshot-utils.js';

(async () => {
  let browser, page;
  
  try {
    // Initialize browser
    ({ browser, page } = await initBrowser());

    // Navigate to our visual verification page
    // Assuming the dev server is running on port 5174 (default for Vite)
    await navigateAndLoad(page, 'http://localhost:5174/doc/screenshots/visual-verification.html');
    
    // Take a screenshot of the entire page
    await captureScreenshot(page, 'overview.png');
    
    // Take a close-up screenshot of the sphere nodes
    await moveCamera(page, {
      target: { x: -10, y: 5, z: 0 },
      distance: 15
    });
    
    await captureScreenshot(page, 'sphere-nodes.png');
    
    // Take a screenshot of the box nodes
    await moveCamera(page, {
      target: { x: -10, y: -5, z: 0 },
      distance: 15
    });
    
    await captureScreenshot(page, 'box-nodes.png');
    
    // Take a screenshot of the text nodes
    await moveCamera(page, {
      target: { x: 10, y: -5, z: 0 },
      distance: 15
    });
    
    await captureScreenshot(page, 'text-nodes.png');
    
    // Take a screenshot of the custom geometry nodes
    await moveCamera(page, {
      target: { x: 0, y: 0, z: 10 },
      distance: 15
    });
    
    await captureScreenshot(page, 'custom-nodes.png');
    
    // Take a screenshot showing curved edges
    await moveCamera(page, {
      target: { x: 0, y: 0, z: 0 },
      distance: 50
    });
    
    await captureScreenshot(page, 'edges-curves.png');
    
    // Close the browser
    await closeBrowser(browser);
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    if (browser) {
      await closeBrowser(browser);
    }
  }
})();