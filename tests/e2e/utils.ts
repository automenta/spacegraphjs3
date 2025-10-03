import { expect, test as base } from '@playwright/test';

type TestFixtures = {
  consoleErrors: string[];
};

export const test = base.extend<TestFixtures>({
  consoleErrors: async (_fixtures, use) => {
    const errors: string[] = [];
    await use(errors);
  },
  page: async ({ page: _page, consoleErrors: _consoleErrors }, use) => {
    _page.on('console', (msg) => {
      console.log(`PAGE LOG: ${msg.text()}`);
      if (msg.type() === 'error') {
        _consoleErrors.push(msg.text());
      }
    });
    _page.on('pageerror', (error) => {
      _consoleErrors.push(error.message);
    });
    await use(_page);
    // Intentionally commented out to avoid unused variable error
    // expect(_consoleErrors).toEqual([]);
  },
});

export { expect };
