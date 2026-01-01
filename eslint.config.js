import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactCompiler from 'eslint-plugin-react-compiler'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

// Base ESLint configuration shared across all packages
export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.nx']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      reactCompiler.configs.recommended,
      importPlugin.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'import/no-extraneous-dependencies': 'error',
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'error',
      'import/no-deprecated': 'error',
      'import/no-mutable-exports': 'error',
    },
  },
])
