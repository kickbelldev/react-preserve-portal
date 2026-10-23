import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'eslint/config'
import baseConfig from '../../eslint.config.js'

export default defineConfig([
  ...baseConfig,
  {
    files: ['**/*.tsx'],
    settings: {
      'import/resolver': {
        typescript: {
          project: path.join(
            path.dirname(fileURLToPath(import.meta.url)),
            'tsconfig.json',
          ),
        },
      },
    },
    rules: {
      // Vue owns the lifecycle and dynamically imports this React mount function.
      'react-refresh/only-export-components': 'off',
    },
  },
])
