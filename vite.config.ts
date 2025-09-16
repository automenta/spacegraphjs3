import { defineConfig } from 'vite';
import { resolve } from 'path';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SpaceGraph',
      fileName: (format) => `spacegraph.${format}.js`,
      formats: ['es', 'umd'],
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
  },
  resolve: {
    alias: {
      three: path.resolve(__dirname, 'node_modules/three'),
    },
    dedupe: ['three'],
    conditions: ['development', 'browser'],
  },
  optimizeDeps: {
    include: ['tslib', 'solid-js'],
  },
});
