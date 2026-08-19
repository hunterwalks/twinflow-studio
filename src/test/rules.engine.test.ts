import { describe, expect, it } from "vitest";
import { industrialPark } from "@/lib/data/industrialPark";
import { messyPark, rootlessSpaces } from "@/lib/data/messyPark";
import { emptyDataset, makeDataset, toRuleDataset } from "@/lib/rules/dataset";
import {
  compareIssues,
  filterBySeverity,
  filterByTable,
  hasBlockingIssues,
  runRules,
  traceText,
} from "@/lib/rules/engine";
import { ALL_RULES } from "@/lib/rules/registry";
import type { Issue } from "@/lib/rules/types";

describe("规则引擎：干净数据", () => {
  const report = runRules(toRuleDataset(industrialPark));

  it("内置 Demo 数据零问题", () => {
    expect(report.totals.all).toBe(0);
    expect(report.issues).toEqual([]);
  });

  it("19 条规则全部执行且全部通过，无跳过", () => {
    expect(report.ruleCount).toBe(19);
    expect(report.passedRuleCount).toBe(19);
    expect(report.triggeredRuleCount).toBe(0);
    expect(report.skippedRuleCount).toBe(0);
  });

  it("不存在阻断级问题", () => {
    expect(hasBlockingIssues(report)).toBe(false);
  });
});

describe("规则引擎：含问题样例数据", () => {
  const report = runRules(messyPark);

  it("命中 14 条规则（R012 因存在根空间而未命中）", () => {
    expect(report.triggeredRuleCount).toBe(14);
    expect(report.skippedRuleCount).toBe(0);
    const r012 = report.byRule.find((r) => r.ruleId === "R012");
    expect(r012?.count).toBe(0);
    expect(r012?.skipped).toBeNull();
  });

  it("各规则命中数符合预期", () => {
    const counts = Object.fromEntries(report.byRule.map((r) => [r.ruleId, r.count]));
    expect(counts).toMatchObject({
      R001: 2,
      R002: 1,
      R003: 1,
      R004: 1,
      R005: 1,
      R006: 1,
      R007: 1,
      R008: 1,
      R009: 1,
      R010: 2,
      R011: 3,
      R012: 0,
      R013: 1,
      R014: 3,
      R015: 1,
    });
  });

  it("存在阻断级问题，且分级汇总与问题总数一致", () => {
    expect(hasBlockingIssues(report)).toBe(true);
    const sum = report.totals.error + report.totals.warning + report.totals.info;
    expect(sum).toBe(report.totals.all);
    expect(report.issues).toHaveLength(report.totals.all);
  });

  it("按表汇总与按类别汇总之和均等于问题总数", () => {
    const tableSum = report.byTable.space + report.byTable.asset + report.byTable.sensor;
    const categorySum = Object.values(report.byCategory).reduce((a, b) => a + b, 0);
    expect(tableSum).toBe(report.totals.all);
    expect(categorySum).toBe(report.totals.all);
  });

  it("每条问题都可溯源到表 / 行号 / 字段", () => {
    for (const issue of report.issues) {
      expect(["space", "asset", "sensor"]).toContain(issue.table);
      expect(issue.ruleId).toMatch(/^R\d{3}$/);
      expect(issue.message.length).toBeGreaterThan(0);
      expect(issue.hint.length).toBeGreaterThan(0);
      if (issue.scope === "row") {
        expect(issue.rowNumber).toBeGreaterThanOrEqual(1);
        expect(issue.field).not.toBeNull();
      } else {
        expect(issue.rowNumber).toBeNull();
        expect(issue.field).toBeNull();
      }
    }
  });
});

describe("规则引擎：排序确定性", () => {
  it("同一输入两次运行结果完全一致", () => {
    const a = runRules(messyPark);
    const b = runRules(messyPark);
    expect(a.issues).toEqual(b.issues);
    expect(a.byRule).toEqual(b.byRule);
  });

  it("问题按 错误 → 警告 → 提示 排序", () => {
    const { issues } = runRules(messyPark);
    const weight = { error: 0, warning: 1, info: 2 } as const;
    for (let i = 1; i < issues.length; i += 1) {
      expect(weight[issues[i].severity]).toBeGreaterThanOrEqual(weight[issues[i - 1].severity]);
    }
  });

  it("同级别内按表（空间 → 设备 → 测点）再按行号排序", () => {
    const { issues } = runRules(messyPark);
    const order = { space: 0, asset: 1, sensor: 2, observation: 3 } as const;
    for (let i = 1; i < issues.length; i += 1) {
      const prev = issues[i - 1];
      const cur = issues[i];
      if (prev.severity !== cur.severity) continue;
      if (prev.table !== cur.table) {
        expect(order[cur.table]).toBeGreaterThan(order[prev.table]);
        continue;
      }
      expect(cur.rowNumber ?? 0).toBeGreaterThanOrEqual(prev.rowNumber ?? 0);
    }
  });

  it("compareIssues 将整表级问题排在该表行级问题之前", () => {
    const base: Issue = {
      ruleId: "R012",
      ruleName: "缺少根空间",
      category: "hierarchy",
      severity: "error",
      table: "space",
      scope: "table",
      rowNumber: null,
      recordId: null,
      field: null,
      message: "m",
      hint: "h",
    };
    const row: Issue = { ...base, ruleId: "R001", scope: "row", rowNumber: 1, field: "id" };
    expect(compareIssues(base, row)).toBeLessThan(0);
  });
});

describe("规则引擎：空数据集与跳过机制", () => {
  it("空数据集不产生任何问题", () => {
    const report = runRules(emptyDataset());
    expect(report.totals.all).toBe(0);
    expect(report.skippedRuleCount).toBeGreaterThan(0);
  });

  it("只导入设备表时，跨表规则被跳过并给出原因", () => {
    const report = runRules(
      makeDataset({
        assets: [
          { id: "AS-001", name: "水泵", type: "水泵", spaceId: "SP-001", description: "说明" },
        ],
      }),
    );
    const r008 = report.byRule.find((r) => r.ruleId === "R008");
    const r014 = report.byRule.find((r) => r.ruleId === "R014");
    expect(r008?.skipped).toBeTruthy();
    expect(r014?.skipped).toBeTruthy();
    // 关键：不得把唯一一条设备记录判为悬空引用
    expect(report.totals.error).toBe(0);
  });

  it("跳过的规则不计入通过数，三类计数之和等于规则总数", () => {
    const report = runRules(makeDataset({ sensors: [] }));
    expect(report.triggeredRuleCount + report.passedRuleCount + report.skippedRuleCount).toBe(
      report.ruleCount,
    );
  });
});

describe("规则引擎：无根空间样例", () => {
  const report = runRules(rootlessSpaces);

  it("R012 命中并输出整表级问题", () => {
    const r012 = report.byRule.find((r) => r.ruleId === "R012");
    expect(r012?.count).toBe(1);
    const issue = report.issues.find((i) => i.ruleId === "R012");
    expect(issue?.scope).toBe("table");
    expect(issue?.table).toBe("space");
  });

  it("同时命中 R010，三条空间互为父级构成环", () => {
    const r010 = report.byRule.find((r) => r.ruleId === "R010");
    expect(r010?.count).toBe(3);
  });
});

describe("辅助函数", () => {
  const report = runRules(messyPark);

  it("filterBySeverity 按级别筛选", () => {
    const errors = filterBySeverity(report.issues, "error");
    expect(errors.length).toBe(report.totals.error);
    expect(errors.every((i) => i.severity === "error")).toBe(true);
    expect(filterBySeverity(report.issues, "all")).toHaveLength(report.totals.all);
  });

  it("filterByTable 按表筛选", () => {
    const spaces = filterByTable(report.issues, "space");
    expect(spaces.length).toBe(report.byTable.space);
    expect(filterByTable(report.issues, "all")).toHaveLength(report.totals.all);
  });

  it("traceText 输出可读溯源信息", () => {
    const rowIssue = report.issues.find((i) => i.scope === "row");
    expect(rowIssue).toBeDefined();
    expect(traceText(rowIssue as Issue)).toContain("第");
    const tableLevel = runRules(rootlessSpaces).issues.find((i) => i.scope === "table");
    expect(traceText(tableLevel as Issue)).toBe("整表");
  });

  it("可传入规则子集运行", () => {
    const subset = ALL_RULES.filter((r) => r.id === "R001");
    const sub = runRules(messyPark, subset);
    expect(sub.ruleCount).toBe(1);
    expect(sub.byRule).toHaveLength(1);
    expect(sub.issues.every((i) => i.ruleId === "R001")).toBe(true);
  });
});
