import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.', // frontend is root

  build: {
    outDir: path.resolve(__dirname, '../server/dist/public'), // output to server/public
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Required to avoid issue with WSL2 + VSCode
      // See: [https://vite.dev/config/server-options#server-watch]
      // and: [https://github.com/vitejs/vite/issues/5878]
      usePolling: true
    },

    // Proxy API requests to server
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  }
});