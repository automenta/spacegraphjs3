import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
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
  resolve: {
    alias: {
      'three/examples/jsm/': path.resolve(
        './node_modules/three/examples/jsm/',
      ),
    },
  },
});