import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'

const plugins = [uni()]

if (process.env.UNI_PLATFORM === 'mp-weixin') {
  plugins.push({
    name: 'copy-cloudfunctions',
    buildStart() {
      const source = path.join(process.env.UNI_INPUT_DIR, 'cloudfunctions')
      if (!existsSync(source)) {
        return
      }
      cpSync(source, path.join(process.env.UNI_OUTPUT_DIR, 'cloudfunctions'), {
        recursive: true,
      })
    },
  })
}

export default defineConfig({
  plugins,
})
