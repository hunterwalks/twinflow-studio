import { test, expect } from "@playwright/test";
import path from "node:path";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

/**
 * v1.0.0 核心旅程 E2E
 * 覆盖陌生用户无需改代码即可稳定走完的关键链路：
 *   1) 离线帮助可达（导航栏 + /help 关键章节）
 *   2) 治理闭环：Demo → 校验 → 应用修复 → 对比
 *   3) 导入：CSV → 字段映射 → 校验结果
 * 全部使用 data-testid 稳定定位，不依赖易变文案 / CSS。
 */
const SPACES_CSV = path.resolve(__dirname, "fixtures", "spaces.csv");

test.describe("v1.0.0 核心旅程", () => {
  test("离线帮助页与导航栏可达", async ({ page }) => {
    await page.goto("/");
    // 导航栏含「帮助」入口
    await expect(page.getByTestId("nav-help")).toBeVisible();
    await page.getByTestId("nav-help").click();
    await expect(page).toHaveURL(/\/help$/);
    // 关键章节均离线可读
    await expect(page.getByTestId("help-quickstart")).toBeVisible();
    await expect(page.getByTestId("help-privacy")).toBeVisible();
    await expect(page.getByTestId("help-model")).toBeVisible();
    await expect(page.getByTestId("help-faq")).toBeVisible();
  });

  test("治理闭环：Demo → 校验 → 应用修复 → 对比", async ({ page }) => {
    // 首页一键载入 Demo（写入本地项目）
    await page.goto("/");
    await page.getByTestId("home-open-demo").click();
    await expect(page).toHaveURL(/\/demo/);
    await expect(page.getByText("数据已加载")).toBeVisible();

    // 校验：默认 messy 样例，存在可自动修复问题
    await page.goto("/validate");
    const rowsBefore = await page
      .locator('[data-testid="issue-table"] tbody tr')
      .count();
    const firstFix = page.locator('[data-testid^="fix-apply-"]').first();
    await expect(firstFix).toBeVisible();
    const targetTestId = (await firstFix.getAttribute("data-testid")) ?? "";

    await firstFix.click();
    // 修复后对应预览消失，问题总数下降
    await expect(page.locator(`[data-testid="${targetTestId}"]`)).toHaveCount(0);
    const rowsAfter = await page
      .locator('[data-testid="issue-table"] tbody tr')
      .count();
    expect(rowsAfter).toBeLessThan(rowsBefore);

    // 对比页渲染质量评分
    await page.goto("/compare");
    await expect(page.getByTestId("compare-table")).toBeVisible();
    await expect(page.getByTestId("compare-table")).toContainText("质量评分");
  });

  test("导入 CSV → 字段映射 → 校验结果", async ({ page }) => {
    await page.goto("/import");
    // 上传干净的 Space 数据集（列与 Space 目标字段同名，可自动映射）
    await page.getByTestId("import-file").setInputFiles(SPACES_CSV);
    // 等待原始预览渲染（解析完成）
    await expect(page.getByTestId("data-table-viewport")).toBeVisible();

    // 默认目标为 space，列可自动映射；确认导入并校验
    await page.getByTestId("import-confirm").click();

    // 校验结果区块出现（汇总 + 质量评分），且引擎对导入数据跑了完整 24 条规则
    await expect(page.getByTestId("validation-summary")).toBeVisible();
    await expect(page.getByTestId("quality-score")).toBeVisible();
    await expect(page.getByTestId("validation-summary")).toContainText("规则总数");
    await expect(page.getByTestId("validation-summary")).toContainText("24");
  });
});
