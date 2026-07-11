import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        shop: resolve(rootDir, 'shop.html'),
        events: resolve(rootDir, 'events.html'),
        resources: resolve(rootDir, 'resources.html'),
      },
    },
  },
})
