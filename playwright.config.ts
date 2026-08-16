import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 配置（v0.7.0）
 * - 覆盖 Scope 中 9 条主流程；
 * - 全部使用 data-testid 稳定定位，不依赖易变文案 / CSS；
 * - webServer 在本地拉起 `next dev`，CI 中由 GitHub Actions 托管。
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PATH: process.env.PATH ?? "",
      NODE_OPTIONS: "--use-system-ca",
    },
  },
});
