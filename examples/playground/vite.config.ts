import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      'spacegraphjs': path.resolve(__dirname, '../../src'),
    },
  },
  server: {
    port: 5175, // Different port from main dev server
  },
});