import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router-dom')) {
            return 'router-vendor';
          }
          if (id.includes('node_modules/react-markdown')) {
            return 'markdown-vendor';
          }
          if (id.includes('/src/components/founder-') || id.includes('/src/pages/Founder')) {
            return 'founder-tools';
          }
          if (id.includes('/src/data/')) {
            return 'content-data';
          }
          return undefined;
        },
      },
    },
  },
})
