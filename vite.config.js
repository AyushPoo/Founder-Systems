import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: fs.realpathSync.native('.'),
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
})
