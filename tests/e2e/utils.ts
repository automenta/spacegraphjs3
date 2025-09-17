import { expect, test as base } from '@playwright/test';

type TestFixtures = {
  consoleErrors: string[];
};

export const test = base.extend<{}, TestFixtures>({
  consoleErrors: async ({}, use) => {
    await use([]);
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
    expect(consoleErrors).toEqual([]);
  },
});

export { expect };
