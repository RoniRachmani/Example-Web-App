import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Libraries get their own chunks, so a deploy that only changes our code
        // leaves them cached, and no single file passes Vite's 500 kB warning.
        codeSplitting: {
          groups: [{
            name: 'react',
            test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
          }, {
            // Only what every page needs. Analytics (and its installations
            // dependency) stays in the chunk analytics.js imports after consent.
            name: 'firebase',
            test: /node_modules[\\/](firebase[\\/](app|auth)|@firebase[\\/](app|auth|component|logger|util))[\\/]/,
          }],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
