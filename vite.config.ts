import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

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
        },
        exports: 'named'
      }
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
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