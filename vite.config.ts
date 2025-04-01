import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dest',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SimpleJekyllSearch',
      fileName: (format) => `simple-jekyll-search${format === 'es' ? '.mjs' : '.js'}`,
      formats: ['umd'],
    },
    minify: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        generatedCode: {
          preset: 'es2015',
          symbols: true
        }
      }
    }
  }
}); 