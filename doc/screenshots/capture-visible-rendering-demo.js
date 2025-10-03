import {
  initBrowser,
  navigateAndLoad,
  captureScreenshot,
  closeBrowser,
} from './screenshot-utils.js';

(async () => {
  let browser, page;

  try {
    // Initialize browser
    ({ browser, page } = await initBrowser());

    // Navigate to our visible rendering demo
    // Assuming the dev server is running on port 5174 (default for Vite)
    await navigateAndLoad(
      page,
      'http://localhost:5174/visible-rendering-demo.html'
    );

    // Take a screenshot of the entire page
    await captureScreenshot(page, 'visible-rendering-demo.png');

    // Close the browser
    await closeBrowser(browser);
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    if (browser) {
      await closeBrowser(browser);
    }
  }
})();
