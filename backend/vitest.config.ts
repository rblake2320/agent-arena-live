import { defineConfig } from 'vitest/config';

// Standalone config so vitest never walks up and loads the frontend's vite.config.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    fileParallelism: false,
  },
});
