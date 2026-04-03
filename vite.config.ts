import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    allowedHosts: ["bola.sellsuki.local", ".trycloudflare.com"],
    proxy: {
      "/auth": {
        target: "http://localhost:8097",
        changeOrigin: true,
      },
      "/v1": {
        target: "http://localhost:8097",
        changeOrigin: true,
      },
      "/webhook/": {
        target: "http://localhost:8097",
        changeOrigin: true,
      },
      "/uploads/": {
        target: "http://localhost:8097",
        changeOrigin: true,
      },
      "/media/": {
        target: "http://localhost:8097",
        changeOrigin: true,
      },
    },
  },
})
