import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SimpleJekyllSearch',
      fileName: (format) => `simple-jekyll-search${format === 'es' ? '.mjs' : '.js'}`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['fuzzysearch'],
      output: {
        globals: {
          fuzzysearch: 'FuzzySearch',
        },
      },
    },
    outDir: 'dest',
    minify: 'terser',
    terserOptions: {
      compress: true,
      mangle: true,
      format: {
        comments: false,
      },
    },
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}); 