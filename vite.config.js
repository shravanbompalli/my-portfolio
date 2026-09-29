import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Libraries change rarely — separate chunks stay browser-cached across site deploys
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion', 'lenis'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})