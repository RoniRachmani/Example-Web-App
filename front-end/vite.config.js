import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://miniature-trout-gxv9wvv5r65cwjq-8000.app.github.dev',
        changeOrigin: true,
      }
    }
  }
})
