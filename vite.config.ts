import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SpaceGraph',
      fileName: 'spacegraph',
    },
    rollupOptions: {
      external: ['three', 'solid-js'],
      output: {
        globals: {
          three: 'THREE',
          'solid-js': 'Solid',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/visual/**', '**/tests/unit/interaction.spec.ts'],
  },
});
