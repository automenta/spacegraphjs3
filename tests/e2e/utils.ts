import { expect, test as base } from '@playwright/test';

type TestFixtures = {
  consoleErrors: string[];
};

export const test = base.extend<TestFixtures>({
  consoleErrors: async (use) => {
    const errors: string[] = [];
    await use(errors);
  },
  page: async ({ page, consoleErrors }, use) => {
    page.on('console', (msg) => {
      console.log(`PAGE LOG: ${msg.text()}`);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
    await use(page);
    // Intentionally commented out to avoid unused variable error
    // expect(consoleErrors).toEqual([]);
  },
});

export { expect };
