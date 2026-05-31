import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Only pre-bundle these known heavy dependencies.
    // This prevents Vite from crawling all dynamic imports (lazy pages)
    // and pre-warming/transforming them before they are actually needed.
    include: ['react', 'react-dom', 'react-router-dom', 'antd', '@ant-design/icons', '@tanstack/react-query', 'dayjs']
  },
  resolve: {
    alias: {
      constants: fileURLToPath(new URL('./src/constants', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1200,
    // Disable <link rel="modulepreload"> injection for all chunks.
    // Without this, Vite injects preload hints for EVERY lazy chunk in index.html,
    // causing the browser to download all page bundles on the first load.
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
            return 'react-vendor'
          }

          if (id.includes('/antd/') || id.includes('/@ant-design/') || id.includes('/rc-')) {
            return 'antd-vendor'
          }

          if (id.includes('/@tanstack/')) {
            return 'tanstack-vendor'
          }

          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'charts-vendor'
          }

          if (id.includes('/dayjs/') || id.includes('/moment/')) {
            return 'date-vendor'
          }
        }
      }
    }
  }
})
