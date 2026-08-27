import { test, expect, type Page } from "@playwright/test";
import { mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

const V1_PROJECT = JSON.stringify({
  version: 1,
  source: "demo",
  spaces: [{ id: "SP-1", name: "园区", type: "park", parentId: "", description: "" }],
  assets: [{ id: "AS-1", name: "设备", type: "x", spaceId: "SP-1", description: "" }],
  sensors: [
    { id: "SE-1", name: "测点", assetId: "AS-1", quantity: "温度", unit: "℃", description: "" },
  ],
  updatedAt: "2026-01-01T00:00:00.000Z",
});

/** 载入城市基础设施（干净）示例：含四表，观测表非空。 */
async function loadCityCleanDemo(page: Page) {
  await page.goto("/demo");
  await page.getByTestId("demo-select-city-clean").click();
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("twinflow-project-v1");
    if (!raw) return false;
    try {
      return (JSON.parse(raw).observations?.length ?? 0) > 0;
    } catch {
      return false;
    }
  });
}

test.describe("v0.8.0 四表项目、导入导出与迁移", () => {
  // 1. Demo 页可切换并查看观测 Observation 表
  test("Demo 页可切换并查看观测 Observation 表", async ({ page }) => {
    await loadCityCleanDemo(page);
    await page.goto("/demo?view=city-clean");
    await page.getByTestId("demo-tab-observation").click();
    await expect(page.getByText("OB-101")).toBeVisible();
    await expect(page.getByText("OB-108")).toBeVisible();
  });

  // 2. 项目导出 JSON 后重新导入可整体恢复（覆盖式）
  test("项目导出 JSON 后重新导入可整体恢复", async ({ page }) => {
    await loadCityCleanDemo(page);
    await page.goto("/project");
    await expect(page.getByTestId("count-observations")).toContainText("8");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("project-export").click(),
    ]);
    const dir = mkdtempSync(join(tmpdir(), "twinflow-"));
    const exported = join(dir, "project.json");
    await download.saveAs(exported);

    // 清空后再导入，验证整体恢复
    await page.getByTestId("project-clear").click();
    const cleared = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("twinflow-project-v1")!),
    );
    expect(cleared.spaces.length).toBe(0);

    await page.setInputFiles('[data-testid="project-import-file"]', exported);
    await expect(page.getByTestId("project-import-result")).toBeVisible();
    const reloaded = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("twinflow-project-v1")!),
    );
    expect(reloaded.observations.length).toBeGreaterThan(0);
  });

  // 3. 刷新后四表项目自动恢复
  test("刷新后四表项目自动恢复", async ({ page }) => {
    await loadCityCleanDemo(page);
    await page.reload();
    await page.goto("/project");
    const reloaded = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("twinflow-project-v1")!),
    );
    expect(reloaded.version).toBe(2);
    expect(reloaded.observations.length).toBeGreaterThan(0);
  });

  // 4. 导入映射模板可保存并跨刷新复用
  test("导入映射模板可保存并复用", async ({ page }) => {
    await page.goto("/import");
    await page.setInputFiles('[data-testid="import-file"]', join(__dirname, "fixtures", "spaces.csv"));
    await expect(page.getByText(/已加载/)).toBeVisible();
    await page.getByTestId("import-template-name").fill("空间映射模板");
    await page.getByTestId("import-template-save").click();
    await expect(page.getByTestId("import-template-saved")).toBeVisible();
    // 刷新后模板仍在（持久化到 localStorage）
    await page.reload();
    await page.goto("/import");
    await expect(page.getByText("空间映射模板", { exact: true })).toBeVisible();
  });

  // 5. v1 旧项目自动迁移为 v2 四表并正确渲染
  test("v1 旧项目自动迁移为 v2 四表", async ({ page }) => {
    await page.goto("/");
    await page.evaluate((v1) => localStorage.setItem("twinflow-project-v1", v1), V1_PROJECT);
    await page.reload();
    await page.goto("/project");
    // 迁移后在内存中为 v2：空间计数为 1，观测表为空数组
    await expect(page.getByTestId("count-spaces")).toContainText("1");
    await expect(page.getByTestId("count-observations")).toContainText("0");
    // 四张卡片均渲染
    await expect(page.getByText("空间 Space")).toBeVisible();
    await expect(page.getByText("观测 Observation")).toBeVisible();
  });

  // 6. 校验页观测表筛选可用
  test("校验页可按观测表筛选问题", async ({ page }) => {
    await page.goto("/validate");
    await page.getByTestId("validate-sample-city-problem").click();
    await expect(page.getByRole("button", { name: "观测 Observation" })).toBeVisible();
  });
});
