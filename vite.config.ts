/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    pool: 'threads',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
  },
  server: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    open: false
  },
  preview: {
    host: '127.0.0.1',
    port: 5199,
    strictPort: true,
    open: false
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
          // Supabase 클라우드 클라이언트 분리
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
