import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// PWA removed — service worker was caching old bundles and blocking updates.
// For an enterprise admin tool, aggressive caching causes more harm than good.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
    ],
    define: {
      'import.meta.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || '')
    },
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:5000',
          ws: true,
        },
      },
    },
    build: {
      outDir: '../server/public',
      emptyOutDir: true,
      minify: false,  // Prevents Rollup TDZ reordering bug with const declarations
    }
  }
})
