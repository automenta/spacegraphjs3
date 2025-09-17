import { defineConfig } from 'vite';
import path, { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SpaceGraph',
      fileName: 'spacegraph',
    },
    rollupOptions: {
      external: [
        'three',
        'solid-js',
        'solid-js/store',
        '@use-gesture/vanilla',
        'd3-force-3d',
        'popmotion',
        'three-mesh-bvh',
        'tslib',
      ],
    },
  },
  resolve: {
    alias: {
      three: path.resolve(__dirname, 'node_modules/three'),
      tslib: path.resolve(__dirname, 'node_modules/tslib'),
    },
    dedupe: ['three', 'tslib'],
    conditions: ['development', 'browser'],
  },
  optimizeDeps: {
    include: ['tslib'],
  },
});
