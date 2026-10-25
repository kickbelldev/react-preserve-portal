import { resolve } from 'node:path'
import { copyFile } from 'node:fs/promises'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    dts({
      include: ['src'],
      rollupTypes: true,
      // NodeNext consumers need declarations matching each runtime module kind.
      afterBuild: () =>
        copyFile(
          resolve(__dirname, 'dist/index.d.ts'),
          resolve(__dirname, 'dist/index.d.cts'),
        ),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactUnmanagedPortal',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: (id) => /^(react|react-dom)(\/|$)/.test(id),
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    minify: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
})
