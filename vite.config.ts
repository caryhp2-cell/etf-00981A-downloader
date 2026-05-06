import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

type VitestUserConfig = UserConfig & {
  test: {
    environment: 'jsdom';
    globals: boolean;
    include: string[];
  };
};

const config: VitestUserConfig = {
  base: '/etf-00981A-downloader/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
};

export default defineConfig(config);
