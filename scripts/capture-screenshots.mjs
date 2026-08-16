// TwinFlow Studio v0.7.0 — 截图证据采集脚本（独立运行，不计入 E2E 主流程）
//
// 用法：
//   1) 先启动 dev 服务：  npm run dev   （监听 http://localhost:3000）
//   2) 再运行本脚本：      node scripts/capture-screenshots.mjs
//
// 脚本会按 Scope 主流程逐一导航到关键页面并截图，保存到
// ../../05_Output/TASK_20260816_006/screenshots/ 下，作为质量门与发布的交付证据。
//
// 注意：本脚本仅用 data-testid 稳定定位，与 flows.spec.ts 的导航逻辑一致。

import { chromium } from "@playwright/test";
import { mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// 输出目录可配置：CI 用默认 ./screenshots（仓库内，便于上传 artifact）；
// 本地可设 SCREENSHOT_DIR 指向交付目录。
const OUT = process.env.SCREENSHOT_DIR
  ? resolve(__dirname, process.env.SCREENSHOT_DIR)
  : resolve(__dirname, "..", "screenshots");

mkdirSync(OUT, { recursive: true });

const shots = [];
async function shot(page, name, testid) {
  if (testid) {
    await page.waitForSelector(`[data-testid="${testid}"]`, {
      state: "visible",
      timeout: 30000,
    });
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  // 给动画/水合一点时间
  await page.waitForTimeout(400);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  shots.push(`${name}.png`);
  console.log(`  ✓ ${name}.png`);
}

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    baseURL: BASE,
  });
  const page = await ctx.newPage();

  console.log(`\n[TwinFlow screenshot] base=${BASE} out=${OUT}\n`);

  // 0) 首页（含 5 步引导 + 隐私说明）
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await shot(page, "01-home", "home-onboarding");

  // 1) Demo 干净基线
  await page.goto("/demo", { waitUntil: "domcontentloaded" });
  await page.getByTestId("demo-select-city-clean").click();
  await page.getByTestId("demo-load").click();
  await shot(page, "02-demo-clean", "demo-clean-badge");

  // 2) Demo 含问题样例（切换数据集，演示规则命中）
  await page.getByTestId("demo-select-city-problem").click();
  await shot(page, "03-demo-problem", "demo-problem-badge");

  // 3) 校验页（运行含问题样例，显示质量评分 / 汇总 / 问题表）
  await page.goto("/validate", { waitUntil: "domcontentloaded" });
  await page.getByTestId("validate-sample-messy").click();
  await shot(page, "04-validate", "quality-score");

  // 4) 关系图（重新载入干净 Demo 以保证节点丰富）
  await page.goto("/demo", { waitUntil: "domcontentloaded" });
  await page.getByTestId("demo-select-city-clean").click();
  await page.getByTestId("demo-load").click();
  await page.goto("/graph", { waitUntil: "domcontentloaded" });
  await shot(page, "05-graph", "graph-canvas");

  // 5) 报告页（基于当前 Demo 项目聚合）
  await page.goto("/report", { waitUntil: "domcontentloaded" });
  await shot(page, "06-report", "report-download-json");

  // 6) 导入：加载 CSV → 预览
  await page.goto("/import", { waitUntil: "domcontentloaded" });
  await page
    .getByTestId("import-file")
    .setInputFiles(join(__dirname, "../e2e/fixtures/spaces.csv"));
  await page.getByText(/已加载/).waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, "07-import-loaded.png"), fullPage: true });
  shots.push("07-import-loaded.png");
  console.log("  ✓ 07-import-loaded.png");

  // 7) 导入：确认映射 → 校验结果
  await page.getByTestId("import-confirm").click();
  await shot(page, "08-import-validated", "validation-summary");

  // 8) 错误文件提示
  await page.getByTestId("import-file").setInputFiles(
    join(__dirname, "../e2e/fixtures/bad.txt"),
  );
  await shot(page, "09-import-error", "error-state");

  // 9) 空文件（仅表头）提示（空文件按「错误提示」处理，展示 error-state）
  await page.getByTestId("import-file").setInputFiles(
    join(__dirname, "../e2e/fixtures/empty.csv"),
  );
  await shot(page, "10-import-empty", "error-state");

  await browser.close();
  console.log(`\n[done] ${shots.length} screenshots -> ${OUT}`);
  console.log(shots.join("\n"));
};

run().catch((e) => {
  console.error("SCREENSHOT_FAILED:", e);
  process.exit(1);
});
