import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: ['.', '../../datos'] },
  },
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    root: '.',
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/setup.ts'],
    restoreMocks: true,
  },
});
