import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SpaceGraph',
      fileName: 'spacegraph',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/visual/**', '**/e2e/**'],
    deps: {
      inline: ['solid-js'],
      optimizer: {
        web: {
          include: ['three-mesh-bvh', 'd3-force-3d'],
        },
      },
    },
  },
  resolve: {
    dedupe: ['three'],
    conditions: ['development', 'browser'],
  },
});
