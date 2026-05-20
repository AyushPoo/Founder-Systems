import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createApiDevMiddlewarePlugin } from './dev/apiDevServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  root: fs.realpathSync.native('.'),
  plugins: [react(), createApiDevMiddlewarePlugin({ rootDir: __dirname })],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
});
