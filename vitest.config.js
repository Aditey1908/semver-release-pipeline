import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Same alias as vite.config.js, so dashboard helpers can be tested in Node
  resolve: { alias: { '@core': path.join(root, 'src/core') } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // In CI, also emit a JUnit report so the pipeline can publish test results
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: { junit: 'reports/junit.xml' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js', 'web/src/lib/**/*.js'],
      // Process bootstrap (ports, signals) is exercised by the container smoke test instead
      exclude: ['src/index.js'],
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
});
