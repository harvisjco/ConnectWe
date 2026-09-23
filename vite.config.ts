import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 코어 벤더
          'vendor-react': ['react', 'react-dom'],
          // lucide 아이콘 분리
          'vendor-lucide': ['lucide-react'],
          // Three.js 3D 렌더링 엔진 분리
          'vendor-three': ['three'],
        },
      },
    },
  },
});
