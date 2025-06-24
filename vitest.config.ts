import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: import.meta.dirname,
    projects: [
      {
        extends: true,
        test: {
          include: ['**/tests/**/*.browser.test.ts'],
          name: 'happy-dom',
          environment: 'happy-dom',
        }
      },
      {
        extends: true,
        test: {
          include: ['**/tests/**/*.node.test.ts'],
          name: { label: 'node', color: 'green' },
          environment: 'node',
        }
      }
    ],
  },
});
