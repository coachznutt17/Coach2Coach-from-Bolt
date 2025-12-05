import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
server: {
  host: '0.0.0.0',
  strictPort: false,     // allow Vite to pick the first open port
  proxy: {
    '/api': {
      target: 'http://localhost:8787',
      changeOrigin: true,
    },
  },
},

  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

