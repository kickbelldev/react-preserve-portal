import { defineConfig } from 'eslint/config'
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
          project: [path.resolve(__dirname, 'tsconfig.app.json')],
        },
      },
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          pathGroups: [
            {
              pattern: '@/features/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/layouts/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/pages/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/constants/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
])

