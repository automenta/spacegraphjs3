import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

(async () => {
  // Create screenshots directory if it doesn't exist
  await fs.mkdir(path.join(process.cwd(), 'doc/screenshots'), {
    recursive: true,
  });

  // Launch the browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Set viewport to a reasonable size
    await page.setViewportSize({ width: 1200, height: 800 });

    // Capture element actors demo
    console.log('Capturing element actors demo...');
    await page.goto('http://localhost:5174/examples/element-actors-demo.html');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(process.cwd(), 'doc/screenshots/element-actors-demo.png'),
      fullPage: true,
    });
    console.log('Element actors demo screenshot saved');

    // Capture edge interaction demo
    console.log('Capturing edge interaction demo...');
    await page.goto(
      'http://localhost:5174/examples/edge-interaction-demo.html'
    );
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(
        process.cwd(),
        'doc/screenshots/edge-interaction-demo.png'
      ),
      fullPage: true,
    });
    console.log('Edge interaction demo screenshot saved');

    // Capture layout engines demo
    console.log('Capturing layout engines demo...');
    await page.goto('http://localhost:5174/examples/layout-engines-demo.html');
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: path.join(process.cwd(), 'doc/screenshots/layout-engines-demo.png'),
      fullPage: true,
    });
    console.log('Layout engines demo screenshot saved');

    // Close the browser
    await browser.close();
    console.log('All screenshots captured successfully!');
  } catch (error) {
    console.error('Error capturing screenshots:', error);
    await browser.close();
  }
})();
