import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Load .env from the monorepo root (two levels up from apps/web)
  envDir: path.resolve(__dirname, '../../'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@servivo/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@servivo/firebase': path.resolve(__dirname, '../../packages/firebase/src/index.ts'),
      '@servivo/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@servivo/scheduling': path.resolve(__dirname, '../../packages/scheduling/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
