
import { defineConfig, devices } from '@playwright/test';

const production = process.env.PW_PRODUCTION === '1';

const baseURL = 'http://localhost:3100';

export default defineConfig({
  testDir: './tests/e2e',

  timeout: 90000,

  expect: {
    timeout: 15000,
  },

  fullyParallel: false,
  workers: 1,

  reporter: 'list',

  use: {
    baseURL,
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

    webServer: {
        command: production
            ? 'npm run start -- --hostname 0.0.0.0 --port 3100'
            : 'npm run dev -- --hostname 0.0.0.0 --port 3100',

        url: `${baseURL}/signup`,
        reuseExistingServer: false,
        timeout: 120000,

        env: {
            ...process.env,
            AUTH_TRUST_HOST: 'true',
        },

        stdout: 'pipe',
        stderr: 'pipe',
    },
});
