// Alchymizers — vanilla JS mutation testing config.
// Customized from the Treeline D10 template: no TypeScript checker,
// mutate paths scoped to engine/ (pure logic) only. UI and network
// layers are intentionally excluded — mutation testing them provides
// little value and drags CI runtime.
// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: [
    'engine/**/*.js',
    '!engine/**/*.test.js',
    '!engine/**/*.spec.js',
  ],
  testRunner: 'vitest',
  // No `checkers` entry — this is a vanilla-JS project with no tsconfig.
  reporters: ['html', 'json', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  jsonReporter: {
    fileName: 'reports/mutation/mutation.json',
  },
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
  timeoutMS: 30000,
  concurrency: 2,
};
