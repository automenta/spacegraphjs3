import { defineConfig } from 'vite';
import { resolve } from 'path';

const projectRootDir = resolve(__dirname);

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
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/visual/**'],
    deps: {
      optimizer: {
        web: {
          include: ['three', 'three-mesh-bvh', 'd3-force-3d'],
        },
      },
    },
  },
  resolve: {
    conditions: ['browser'],
  },
});
