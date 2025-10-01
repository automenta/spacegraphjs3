import { test } from '@playwright/test';

test('debug console errors', async ({ page }) => {
  const consoleLogs: string[] = [];
  const errorLogs: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`${msg.type()}: ${text}`);
    if (msg.type() === 'error') {
      errorLogs.push(text);
    }
  });

  page.on('pageerror', (error) => {
    errorLogs.push(`Page error: ${error.message}`);
    console.log('Page error stack:', error.stack);
  });

  await page.goto('/');
  
  // Wait a bit for any async errors
  await page.waitForTimeout(3000);
  
  console.log('All console logs:', consoleLogs);
  console.log('Error logs:', errorLogs);
  
  // Let's also check the page content
  const content = await page.content();
  console.log('Page content:', content);
  
  // Check if there are any script errors in the page
  const scripts = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    return scripts.map(s => ({
      src: s.src,
      innerHTML: s.innerHTML?.substring(0, 500)
    }));
  });
  
  console.log('Scripts found:', JSON.stringify(scripts, null, 2));
  
  // Try to access the problematic index.jsx file directly
  try {
    const indexResponse = await page.goto('/src/index.jsx');
    console.log('Index.jsx response status:', indexResponse?.status());
    if (indexResponse && indexResponse.status() === 200) {
      const indexContent = await indexResponse.text();
      console.log('Index.jsx content (first 500 chars):', indexContent.substring(0, 500));
    }
  } catch (e) {
    console.log('Error accessing index.jsx:', e);
  }
});