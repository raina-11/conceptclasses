import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:43972',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      name: 'synthetic-harness',
      command: 'npm run dev -- --host 127.0.0.1 --port 43972 --strictPort',
      url: 'http://127.0.0.1:43972/tests/e2e/harness.html?state=guest',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      name: 'netlify-build',
      command: 'node tests/e2e/serve-netlify-build.mjs',
      url: 'http://127.0.0.1:43971',
      env: { E2E_BUILD_PORT: '43971' },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
})
