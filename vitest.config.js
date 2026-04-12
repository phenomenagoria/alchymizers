// Alchymizers vitest config — vanilla JS project, no TypeScript.
// Scoped to engine/ tests only. UI and network layers are DOM/PeerJS
// integration code and are not unit-tested here.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js', 'engine/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['engine/**/*.js'],
      exclude: ['engine/**/*.test.js'],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
    },
  },
});
