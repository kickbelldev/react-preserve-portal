import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import baseConfig from '../../eslint.config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig([
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: [path.resolve(__dirname, 'tsconfig.json')],
        },
      },
    },
  },
])

