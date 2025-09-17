import { expect, test } from '@playwright/test';

test('should load page without syntax errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('/index.html');

  const syntaxError = errors.find((error) =>
    error.includes("does not provide an export named 'dragAction'")
  );
  expect(syntaxError).toBeUndefined();
});
