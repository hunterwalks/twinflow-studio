import { test, expect } from "@playwright/test";

/**
 * v0.9.0 问题修复预览引擎 E2E
 * 覆盖：/validate 页为可确定性修复的问题渲染 before→after 预览，
 * 点击「应用修复」后重新校验、对应问题消失。
 */
test.describe("v0.9.0 修复预览与一键应用", () => {
  test("含问题样例展示修复预览并可应用（问题数下降）", async ({ page }) => {
    await page.goto("/validate"); // 默认样例即含问题样例 messy

    // 至少存在一个可自动修复的问题（R003/R004/R009/R015 等）
    const applyButtons = page.locator('[data-testid^="fix-apply-"]');
    await expect(applyButtons.first()).toBeVisible();

    const rowsBefore = await page
      .locator('[data-testid="issue-table"] tbody tr')
      .count();

    const firstFix = applyButtons.first();
    const firstFixTestId = await firstFix.getAttribute("data-testid");
    expect(firstFixTestId).toBeTruthy();

    // 点击应用修复
    await firstFix.click();

    // 该校验问题的修复预览消失，问题总数下降
    await expect(page.locator(`[data-testid="${firstFixTestId}"]`)).toHaveCount(0);
    const rowsAfter = await page
      .locator('[data-testid="issue-table"] tbody tr')
      .count();
    expect(rowsAfter).toBeLessThan(rowsBefore);
  });

  test("干净数据不出现修复按钮（无假阳性）", async ({ page }) => {
    await page.goto("/validate");
    await page.getByTestId("validate-sample-city-clean").click();

    await expect(page.locator('[data-testid="issue-table"]')).toBeVisible();
    // 干净样例应没有可自动修复项
    await expect(page.locator('[data-testid^="fix-apply-"]')).toHaveCount(0);
  });
});

test.describe("v0.9.0 跨项目对比页", () => {
  test("对比页渲染并展示质量评分与主要问题规则", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByTestId("compare-table")).toBeVisible();
    // 默认 A=城市基础设施（干净）质量 100，B=含问题样例质量 < 100
    await expect(page.getByTestId("compare-select-a")).toHaveValue("city-clean");
    await expect(page.getByTestId("compare-select-b")).toHaveValue("messy");
    await expect(page.getByTestId("compare-table")).toContainText("质量评分");
    await expect(page.getByTestId("compare-table")).toContainText("100");
    // B 侧存在主要问题规则
    await expect(page.getByTestId("compare-toprules-b").locator("li").first()).toBeVisible();
    // 切换 A 后重新计算并渲染
    await page.getByTestId("compare-select-a").selectOption("city-problem");
    await expect(page.getByTestId("compare-toprules-a").locator("li").first()).toBeVisible();
  });
});
