import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'public',
  build: {
    copyPublicDir: true,
    rollupOptions: {
      external: (id) => {
        if (id.includes('copy copy')) return true;
        return false;
      }
    }
  }
});
