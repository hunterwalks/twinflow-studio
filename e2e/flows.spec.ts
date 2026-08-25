import { test, expect, type Page } from "@playwright/test";
import { join } from "path";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

// Playwright 将 .ts spec 转译为 CJS，__dirname 可用；避免使用 import.meta.url。
const FIX = join(__dirname, "fixtures");

/** 确保项目已载入 Demo 数据（用于依赖数据的用例）。 */
async function ensureDemoLoaded(page: Page) {
  await page.goto("/demo");
  await page.getByTestId("demo-load").click();
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("twinflow-project-v1");
    if (!raw) return false;
    try {
      return (JSON.parse(raw).spaces?.length ?? 0) > 0;
    } catch {
      return false;
    }
  });
}

test.describe("TwinFlow Studio 主流程 E2E", () => {
  // 1. 首页打开 Demo
  test("首页可打开 Demo 页面", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-onboarding")).toBeVisible();
    await page.getByTestId("home-open-demo").click();
    await expect(page).toHaveURL(/\/demo$/);
  });

  // 2. Demo 数据写入项目（持久化到 localStorage）
  test("Demo 数据写入项目并可被读取", async ({ page }) => {
    await ensureDemoLoaded(page);
    const raw = await page.evaluate(() => localStorage.getItem("twinflow-project-v1"));
    expect(raw).toBeTruthy();
    const proj = JSON.parse(raw!);
    expect(proj.spaces.length).toBeGreaterThan(0);
    expect(proj.source).toBe("demo");
  });

  // 3. 校验页显示质量结果
  test("校验页运行规则并显示质量评分与汇总", async ({ page }) => {
    await page.goto("/validate");
    await expect(page.getByTestId("validate-sample-messy")).toBeVisible();
    await page.getByTestId("validate-sample-messy").click();
    await expect(page.getByTestId("infostrip")).toBeVisible();
    await expect(page.getByTestId("quality-score")).toBeVisible();
    await expect(page.getByTestId("issue-table")).toBeVisible();
  });

  // 4. 关系图页面可打开并显示节点
  test("关系图页面显示节点与统计", async ({ page }) => {
    await ensureDemoLoaded(page);
    await page.goto("/graph");
    await expect(page.getByTestId("graph-canvas")).toBeVisible();
    await expect(page.getByTestId("graph-stats")).toContainText(/节点\s*\d+/);
  });

  // 5. 报告页可生成 HTML / JSON 下载
  test("报告页可下载 JSON 与 HTML", async ({ page }) => {
    await ensureDemoLoaded(page);
    await page.goto("/report");
    await expect(page.getByTestId("report-download-json")).toBeVisible();
    await expect(page.getByTestId("report-download-html")).toBeVisible();

    const [json] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("report-download-json").click(),
    ]);
    expect(json.suggestedFilename()).toMatch(/\.json$/);

    const [html] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("report-download-html").click(),
    ]);
    expect(html.suggestedFilename()).toMatch(/\.html$/);
  });

  // 6. 刷新后项目仍能恢复
  test("刷新后项目数据自动恢复", async ({ page }) => {
    await ensureDemoLoaded(page);
    await page.reload();
    await page.goto("/graph");
    await expect(page.getByTestId("graph-stats")).toContainText(/节点\s*[1-9]\d*/);
  });

  // 7. 清空项目后进入明确空态
  test("清空项目后显示明确空态", async ({ page }) => {
    await ensureDemoLoaded(page);
    await page.goto("/graph");
    // 已载入 Demo，应先看到画布（非空），再清空并断言进入明确空态。
    await expect(page.getByTestId("graph-canvas")).toBeVisible();
    await page.getByTestId("graph-clear").click();
    await expect(page.getByTestId("graph-empty")).toBeVisible();
  });

  // 8. CSV 文件导入、字段映射、校验结果
  test("CSV 导入并完成字段映射与校验", async ({ page }) => {
    await page.goto("/import");
    await page.setInputFiles('[data-testid="import-file"]', join(FIX, "spaces.csv"));
    await expect(page.getByText(/已加载/)).toBeVisible();
    await page.getByTestId("import-confirm").click();
    await expect(page.getByTestId("validation-summary")).toBeVisible();
    // 导入结果应显示规则执行汇总（含「通过规则」卡片）
    await expect(page.getByTestId("validation-summary")).toContainText("通过规则");
  });

  // 9a. 错误文件提示
  test("不支持的文件格式给出错误提示", async ({ page }) => {
    await page.goto("/import");
    await page.setInputFiles('[data-testid="import-file"]', join(FIX, "bad.txt"));
    await expect(page.getByTestId("error-state")).toBeVisible();
    await expect(page.getByText(/不支持的文件格式/)).toBeVisible();
  });

  // 9b. 空文件（无数据行）提示
  test("仅表头无数据行的文件给出明确提示", async ({ page }) => {
    await page.goto("/import");
    await page.setInputFiles('[data-testid="import-file"]', join(FIX, "empty.csv"));
    await expect(page.getByTestId("error-state")).toBeVisible();
    await expect(page.getByText(/文件为空或没有可解析的数据行/)).toBeVisible();
  });
});
