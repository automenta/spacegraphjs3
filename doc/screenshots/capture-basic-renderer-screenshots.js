import { initBrowser, navigateAndLoad, captureScreenshot, moveCamera, switchToBasicRenderer, closeBrowser } from './screenshot-utils.js';

(async () => {
  let browser, page;
  
  try {
    // Initialize browser
    ({ browser, page } = await initBrowser());

    // Navigate to our visual verification page
    await navigateAndLoad(page, 'http://localhost:5174/doc/screenshots/visual-verification.html');
    
    // Switch to BasicRenderer
    await switchToBasicRenderer(page);
    
    // Take a screenshot of the entire page with BasicRenderer
    await captureScreenshot(page, 'basic-renderer-overview.png');
    
    // Take a close-up screenshot of the sphere nodes
    await moveCamera(page, {
      target: { x: -10, y: 5, z: 0 },
      distance: 15
    });
    
    await captureScreenshot(page, 'basic-renderer-sphere-nodes.png');
    
    // Take a screenshot of the box nodes
    await moveCamera(page, {
      target: { x: -10, y: -5, z: 0 },
      distance: 15
    });
    
    await captureScreenshot(page, 'basic-renderer-box-nodes.png');
    
    // Take a screenshot of the text nodes
    await moveCamera(page, {
      target: { x: 10, y: -5, z: 0 },
      distance: 15
    });
    
    await captureScreenshot(page, 'basic-renderer-text-nodes.png');
    
    // Take a screenshot of the custom geometry nodes
    await moveCamera(page, {
      target: { x: 0, y: 0, z: 10 },
      distance: 15
    });
    
    await captureScreenshot(page, 'basic-renderer-custom-nodes.png');
    
    // Take a screenshot showing curved edges
    await moveCamera(page, {
      target: { x: 0, y: 0, z: 0 },
      distance: 50
    });
    
    await captureScreenshot(page, 'basic-renderer-edges-curves.png');
    
    // Close the browser
    await closeBrowser(browser);
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    if (browser) {
      await closeBrowser(browser);
    }
  }
})();