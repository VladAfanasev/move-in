import { defineConfig, devices } from "@playwright/test"

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",

  /* Configure projects for major browsers */
  projects: [
    // Unit tests - no browser needed, no web server
    {
      name: "unit",
      testMatch: /.*\.unit\.spec\.ts$/,
      use: {
        // No browser context needed for unit tests
      },
    },
    // Integration tests - no browser needed, no web server
    {
      name: "integration",
      testMatch: /.*\.integration\.spec\.ts$/,
      use: {
        // No browser context needed for integration tests
      },
    },
    // E2E tests - need browser and web server
    {
      name: "chromium",
      testMatch: /.*\.e2e\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: "http://localhost:3000",
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
      },
    },

    {
      name: "firefox",
      testMatch: /.*\.e2e\.spec\.ts$/,
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
      },
    },

    {
      name: "webkit",
      testMatch: /.*\.e2e\.spec\.ts$/,
      use: {
        ...devices["Desktop Safari"],
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
      },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      testMatch: /.*\.e2e\.spec\.ts$/,
      use: {
        ...devices["Pixel 5"],
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
      },
    },
    {
      name: "Mobile Safari",
      testMatch: /.*\.e2e\.spec\.ts$/,
      use: {
        ...devices["iPhone 12"],
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
      },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the E2E tests */
  webServer:
    process.env.TEST_TYPE === "e2e"
      ? {
          command: "bun dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
        }
      : undefined,
})
