/**
 * TwinFlow Studio —— 整体模拟点击测试脚本（驱动线上部署站点）
 * 用途：按用户诉求对全站做"模拟点击"，采集截图 + 控制台错误 + 关键断言，
 *       作为整体分析与优化意见的实证依据。仅做只读式交互与客户端下载，不改动任何线上/本地数据。
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "https://hunterwalks.github.io/twinflow-studio";
const OUTDIR = "G:/AI_System/01_Projects/100_202608_TwinFlow_Studio/05_Output/20260823_TwinFlow_Analysis/screenshots";
const XLSX = "G:/AI_System/01_Projects/100_202608_TwinFlow_Studio/01_Source/20260823_TwinFlow_Studio_SampleData_V1.0/20260823_TwinFlow_Studio_SampleData_All_V1.0.xlsx";

fs.mkdirSync(OUTDIR, { recursive: true });

const consoleErrors = [];
const pageErrors = [];
const log = [];

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => pageErrors.push(e.message));
  const url = (p) => BASE + (p === "/" ? "/" : p.endsWith("/") ? p : p + "/");
  const shot = (n) => page.screenshot({ path: path.join(OUTDIR, n), fullPage: true });

  // 1) 首页
  log.push("【1】首页");
  await page.goto(url("/"), { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: "首页" }).first().waitFor({ timeout: 15000 });
  await shot("01-home.png");

  // 2) Demo 载入
  log.push("【2】Demo 载入");
  await page.getByTestId("home-open-demo").click();
  await page.getByTestId("demo-load").waitFor({ timeout: 15000 });
  await page.getByTestId("demo-load").click();
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("twinflow-project-v1");
    if (!raw) return false;
    try { return (JSON.parse(raw).spaces?.length ?? 0) > 0; } catch { return false; }
  }, { timeout: 15000 });
  await shot("02-demo.png");

  // 3) 校验（含问题样例）
  log.push("【3】校验页");
  await page.goto(url("/validate"), { waitUntil: "domcontentloaded" });
  await page.getByTestId("validate-sample-messy").click();
  await page.getByTestId("validation-summary").waitFor({ timeout: 15000 });
  await page.getByTestId("quality-score").waitFor();
  const vSummary = (await page.getByTestId("validation-summary").innerText()).replace(/\s+/g, " ");
  log.push("校验汇总: " + vSummary);
  await shot("03-validate.png");

  // 4) 关系图（重点证据）
  log.push("【4】关系图");
  await page.goto(url("/graph"), { waitUntil: "domcontentloaded" });
  await page.getByTestId("graph-canvas").waitFor({ timeout: 15000 });
  const stats = (await page.getByTestId("graph-stats").innerText()).replace(/\s+/g, " ");
  log.push("关系图统计: " + stats);
  // 尝试点击节点，验证"对象详情"面板是否会更新（验证交互是否生效）
  const aside = page.locator("aside");
  const detailBefore = (await aside.innerText()).replace(/\s+/g, " ");
  const node = page.locator(".react-flow__node").first();
  const nodeCount = await node.count();
  if (nodeCount > 0) {
    await node.click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }
  const detailAfter = (await aside.innerText()).replace(/\s+/g, " ");
  log.push("节点数=" + nodeCount + " | 点击节点后详情面板是否变化=" + (detailBefore !== detailAfter));
  await page.screenshot({ path: path.join(OUTDIR, "04-graph.png"), fullPage: false });

  // 5) 报告下载
  log.push("【5】报告下载");
  await page.goto(url("/report"), { waitUntil: "domcontentloaded" });
  await page.getByTestId("report-download-html").waitFor({ timeout: 15000 });
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByTestId("report-download-html").click(),
  ]);
  const htmlName = dl.suggestedFilename();
  await dl.saveAs(path.join(OUTDIR, "report.html"));
  log.push("报告HTML下载: " + htmlName);
  await shot("05-report.png");

  // 6) 对比
  log.push("【6】对比页");
  await page.goto(url("/compare"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot("06-compare.png");

  // 7) 模型配置
  log.push("【7】模型配置页");
  await page.goto(url("/model"), { waitUntil: "domcontentloaded" });
  await page.getByTestId("model-type-space").waitFor({ timeout: 15000 });
  await shot("07-model.png");

  // 8) 项目管理导出
  log.push("【8】项目导出");
  await page.goto(url("/project"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.getByTestId("project-export").waitFor({ timeout: 15000 });
  const [dl2] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByTestId("project-export").click(),
  ]).catch(() => [null]);
  if (dl2) { await dl2.saveAs(path.join(OUTDIR, "project.json")); log.push("项目JSON导出: " + dl2.suggestedFilename()); }
  else log.push("项目JSON导出: 未触发下载");
  await shot("08-project.png");

  // 9) 导入样例 XLSX（四表依次）
  log.push("【9】导入样例 XLSX");
  await page.goto(url("/import"), { waitUntil: "domcontentloaded" });
  await page.getByTestId("import-file").waitFor({ timeout: 15000 });
  const sheets = [
    { sheet: "Space", target: "空间 Space" },
    { sheet: "Asset", target: "资产 Asset" },
    { sheet: "Sensor", target: "传感器 Sensor" },
    { sheet: "Observation", target: "观测 Observation" },
  ];
  for (const { sheet, target } of sheets) {
    const reset = page.getByRole("button", { name: "重新选择" });
    if (await reset.count()) await reset.click().catch(() => {});
    await page.setInputFiles('[data-testid="import-file"]', XLSX).catch((e) => log.push("  setInputFiles失败: " + e.message));
    // 解析结果：出现"已加载"或"错误态"二选一
    let parsed = false;
    try {
      await page.getByText(/已加载/).waitFor({ timeout: 15000 });
      parsed = true;
    } catch {
      const errTxt = await page.getByTestId("error-state").innerText().catch(() => "(无错误态)");
      log.push(`导入[${sheet}] 解析未成功，错误态=${errTxt}`);
    }
    if (!parsed) { await shot(`09-import-${sheet}-parsefail.png`); continue; }
    const tab = page.getByRole("tab", { name: sheet, exact: true });
    if (await tab.count()) await tab.click().catch(() => {});
    await page.getByRole("button", { name: target, exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByTestId("import-confirm").click();
    await page.getByTestId("validation-summary").waitFor({ timeout: 15000 }).catch(() => {});
    const ok = await page.getByText(/通过/).count();
    const err = await page.getByText(/错误/).count();
    log.push(`导入[${sheet}] 通过计数块=${ok} 错误计数块=${err}`);
    await shot(`09-import-${sheet}.png`);
  }

  await browser.close();

  const report = { base: BASE, consoleErrors, pageErrors, log };
  fs.writeFileSync(path.join(OUTDIR, "clicktest-report.json"), JSON.stringify(report, null, 2));
  console.log("控制台错误数:", consoleErrors.length);
  console.log("页面异常数:", pageErrors.length);
  console.log(log.join("\n"));
  if (consoleErrors.length) console.log("CONSOLE_ERRORS:\n" + consoleErrors.join("\n"));
  if (pageErrors.length) console.log("PAGE_ERRORS:\n" + pageErrors.join("\n"));
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
