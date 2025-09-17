import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/visual/**',
      '**/e2e/**',
    ],
  },
  server: {
    deps: {
      inline: ['d3-force-3d'],
    },
  },
});