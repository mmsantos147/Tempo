import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

const apiProxy: Record<string, ProxyOptions> = {
  '/api': {
    target: 'http://localhost:8080',
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
})
