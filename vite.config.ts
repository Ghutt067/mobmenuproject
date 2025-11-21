import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separar vendor chunks para melhor cache
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }
        },
        // Otimizar nomes de chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Otimizações de build
    minify: 'esbuild',
    target: 'es2015',
    cssCodeSplit: true,
    // Aumentar chunk size warning limit (produtos podem gerar chunks grandes)
    chunkSizeWarningLimit: 1000,
    // Otimizar sourcemaps em produção
    sourcemap: false,
  },
  // Otimizações de desenvolvimento
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    // Pre-bundle para desenvolvimento mais rápido
    exclude: [],
  },
  // Otimizações de servidor
  server: {
    // HMR otimizado
    hmr: {
      overlay: true,
    },
  },
})
