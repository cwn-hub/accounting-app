import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Chart/reports chunk
          'charts': ['recharts'],
          // PDF export chunk
          'pdf-export': ['jspdf', 'jspdf-autotable'],
          // Table chunk
          'table': ['@tanstack/react-table'],
          // Icons
          'icons': ['lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit (chunk splitting reduces sizes)
    chunkSizeWarningLimit: 600,
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
