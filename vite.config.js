import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',   // relative paths so Electron can load files from disk
  server: {
    // Explicit IPv4 bind: with plain `localhost`, node ≥17 can bind ::1 only,
    // which browsers/wait-on may fail to reach (seen on Windows + node 24).
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
})
