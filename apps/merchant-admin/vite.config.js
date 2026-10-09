import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const appRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: appRoot,
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5174,
  },
  build: {
    outDir: fileURLToPath(new URL('../../dist/merchant-admin', import.meta.url)),
    emptyOutDir: true,
  },
})
