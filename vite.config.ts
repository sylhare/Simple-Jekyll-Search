import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    outDir: 'dest',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SimpleJekyllSearch',
      fileName: (_format) => 'simple-jekyll-search.js',
      formats: ['umd'],
    },
    minify: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        generatedCode: {
          preset: 'es2015',
          symbols: true
        },
        exports: 'named'
      }
    }
  },
  test: {
    environment: 'jsdom',
    maxWorkers: 4,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/index.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
}); 