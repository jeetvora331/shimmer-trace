import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/shimmer-trace/' : '/',
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
  },
});
