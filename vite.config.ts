import { defineConfig } from 'vite';
import { resolve } from 'path';
import path from 'path';

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
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/visual/**',
      '**/e2e/**',
    ],
    server: {
      deps: {
        inline: ['solid-js'],
      },
    },
    deps: {
      optimizer: {
        web: {
          include: ['three', 'three-mesh-bvh', 'd3-force-3d'],
        },
      },
    },
  },
  resolve: {
    alias: {
      three: path.resolve(__dirname, 'node_modules/three'),
    },
    dedupe: ['three'],
    conditions: ['development', 'browser'],
  },
});
