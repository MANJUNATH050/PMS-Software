import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

<<<<<<< HEAD
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
=======
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
})
