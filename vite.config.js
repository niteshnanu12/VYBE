import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          charts: ['chart.js', 'react-chartjs-2'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          pdf: ['jspdf', 'jspdf-autotable', 'html2canvas']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    globals: true,
  }
});
