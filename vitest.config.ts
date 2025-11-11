/**
 * Vitest configuration for Reachy Mini TurboWarp Extension
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Integration tests need longer timeout due to robot movements
    testTimeout: 15000, // 15 seconds per test
    hookTimeout: 30000, // 30 seconds for beforeAll/afterEach

    // Run tests sequentially to avoid state conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
