import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self' ws://localhost:* http://localhost:* https://*.supabase.co wss://*.supabase.co https://openrouter.ai",
        "worker-src 'self' blob:",
      ].join('; '),
    },
  },
  // Silence SES/lockdown warnings from @supabase/supabase-js — they are harmless
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message?.includes('SES') || warning.message?.includes('lockdown')) return
        warn(warning)
      },
    },
  },
})
