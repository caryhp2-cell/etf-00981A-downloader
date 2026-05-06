import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

type VitestUserConfig = UserConfig & {
  test: {
    environment: 'jsdom';
    globals: boolean;
  };
};

const config: VitestUserConfig = {
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
};

export default defineConfig(config);
