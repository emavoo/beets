import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/item': 'http://127.0.0.1:8337',
      '/album': 'http://127.0.0.1:8337',
      '/artist': 'http://127.0.0.1:8337',
      '/stats': 'http://127.0.0.1:8337',
      '/upload': 'http://127.0.0.1:8337',
    },
  },
})
