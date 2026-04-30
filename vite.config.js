import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  }
});
