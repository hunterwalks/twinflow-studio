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
  workers: process.env.CI ? 2 : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "html",
  use: {
    baseURL: "http://localhost:3103",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run build && npm run start -- --port 3103",
    url: "http://localhost:3103",
    // 不复用遗留服务器：构建目录更新后复用旧进程会产生 chunk 清单错配和偶发客户端异常。
    reuseExistingServer: false,
    timeout: 180_000,
    // 清空 NODE_OPTIONS：Node 20+ 拒绝 --use-system-ca（启动直接 exit 9），与 .github/workflows 保持一致
    env: {
      PATH: process.env.PATH ?? "",
      NODE_OPTIONS: "",
    },
  },
});
