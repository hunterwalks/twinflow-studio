import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

test("模型配置页：可达并展示四表核心模型", async ({ page }) => {
  await page.goto("/model");
  await expect(page.getByTestId("nav-model")).toBeVisible();
  await expect(page.getByRole("heading", { name: "模型配置", exact: true })).toBeVisible();
  // 四张核心对象类型
  await expect(page.getByTestId("model-type-space")).toBeVisible();
  await expect(page.getByTestId("model-type-asset")).toBeVisible();
  await expect(page.getByTestId("model-type-sensor")).toBeVisible();
  await expect(page.getByTestId("model-type-observation")).toBeVisible();
});

test("模型配置页：JSON 校验与错误提示", async ({ page }) => {
  await page.goto("/model");
  const ta = page.getByTestId("model-json");
  // 非法 JSON → 出现错误提示且应用按钮禁用
  await ta.fill("{ bad json");
  await expect(page.getByTestId("model-errors")).toBeVisible();
  await expect(page.getByTestId("model-apply")).toBeDisabled();
  // 合法最小配置 → 错误消失且应用按钮可用
  const good = JSON.stringify({
    configVersion: 1,
    name: "t",
    objectTypes: [
      {
        id: "space",
        label: "S",
        keyField: "id",
        fields: [{ key: "id", label: "ID", type: "string", required: true }],
      },
    ],
    enums: [],
  });
  await ta.fill(good);
  await expect(page.getByTestId("model-errors")).toHaveCount(0);
  await expect(page.getByTestId("model-apply")).toBeEnabled();
});

test("模型配置页：规则包切换改变试运行的规则数", async ({ page }) => {
  // 载入 Demo 数据（写入本地项目）
  await page.goto("/");
  await page.getByTestId("home-open-demo").click();
  await expect(page.getByText("数据已加载")).toBeVisible();
  await page.goto("/model");

  // 默认内置 + 配置包开启，试运行
  await page.getByTestId("model-trial").click();
  const r1 = await page.getByTestId("model-trial-result").innerText();
  const count1 = Number((r1.match(/共 (\d+) 条规则/) || [])[1] ?? "0");

  // 仅配置包：关闭内置包后重试
  await page.getByTestId("pkg-builtin").setChecked(false);
  await page.getByTestId("model-trial").click();
  const r2 = await page.getByTestId("model-trial-result").innerText();
  const count2 = Number((r2.match(/共 (\d+) 条规则/) || [])[1] ?? "0");

  // 内置(24) + 配置 > 仅配置 > 0，证明引擎按所选包运行
  expect(count1).toBeGreaterThan(count2);
  expect(count2).toBeGreaterThan(0);
});
