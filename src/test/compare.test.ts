import { describe, expect, it } from "vitest";
import { makeDataset } from "@/lib/rules/dataset";
import { betterLabel, compareProjects, profileDataset } from "@/lib/compare";
import { industrialPark } from "@/lib/data/industrialPark";
import { messyPark } from "@/lib/data/messyPark";
import { toRuleDataset } from "@/lib/rules/dataset";

describe("profileDataset 项目画像", () => {
  it("干净数据：质量满分、零问题、零命中规则", () => {
    const p = profileDataset("demo", toRuleDataset(industrialPark));
    expect(p.recordCount).toBeGreaterThan(0);
    expect(p.issues).toBe(0);
    expect(p.quality).toBe(100);
    expect(p.triggeredRules).toBe(0);
    expect(p.topRules).toEqual([]);
    expect(p.counts.observations).toBe(0);
  });

  it("含问题数据：画像字段完整且可自洽", () => {
    const p = profileDataset("messy", messyPark);
    expect(p.issues).toBeGreaterThan(0);
    expect(p.quality).toBeLessThan(100);
    expect(p.triggeredRules).toBeGreaterThan(0);
    expect(p.topRules.length).toBeGreaterThan(0);
    expect(p.topRules.length).toBeLessThanOrEqual(3);
    expect(p.topRules[0].count).toBeGreaterThan(0);
    // 问题总数 = 分级别之和
    expect(p.bySeverity.error + p.bySeverity.warning + p.bySeverity.info).toBe(p.issues);
    // 命中 + 通过 + 跳过 = 规则总数
    expect(p.triggeredRules + p.passedRules + p.skippedRules).toBe(24);
  });

  it("空数据集画像合法", () => {
    const p = profileDataset("empty", makeDataset({}));
    expect(p.recordCount).toBe(0);
    expect(p.issues).toBe(0);
    expect(p.quality).toBe(100);
    expect(p.skippedRules).toBeGreaterThan(0); // 无观测表等被跳过
  });
});

describe("compareProjects 对比行", () => {
  const clean = profileDataset("clean", toRuleDataset(industrialPark));
  const messy = profileDataset("messy", messyPark);

  it("包含关键指标行", () => {
    const rows = compareProjects(clean, messy);
    const keys = rows.map((r) => r.key);
    expect(keys).toContain("records");
    expect(keys).toContain("quality");
    expect(keys).toContain("issues");
    expect(keys).toContain("sev-error");
    expect(keys).toContain("sev-warning");
    expect(keys).toContain("triggered");
    expect(keys).toContain("passed");
    expect(keys).toContain("skipped");
    expect(keys).toContain("count-spaces");
    expect(keys).toContain("count-observations");
  });

  it("质量评分行：高分为优，方向正确", () => {
    const rows = compareProjects(clean, messy);
    const quality = rows.find((r) => r.key === "quality")!;
    expect(quality.left).toBe("100");
    expect(quality.right).toBe(String(messy.quality));
    expect(quality.better).toBe("left");
    expect(quality.hint).toContain("越高越好");
  });

  it("问题总数行：少为优，方向正确", () => {
    const rows = compareProjects(clean, messy);
    const issues = rows.find((r) => r.key === "issues")!;
    expect(issues.better).toBe("left");
  });

  it("持平判定与不可比指标", () => {
    const a = profileDataset("a", toRuleDataset(industrialPark));
    const b = profileDataset("b", toRuleDataset(industrialPark));
    const rows = compareProjects(a, b);
    expect(rows.find((r) => r.key === "quality")!.better).toBe("tie");
    expect(rows.find((r) => r.key === "issues")!.better).toBe("tie");
    expect(rows.find((r) => r.key === "records")!.better).toBe("na");
    expect(rows.find((r) => r.key === "skipped")!.better).toBe("na");
  });

  it("betterLabel 文案完整", () => {
    expect(betterLabel("left")).toContain("更优");
    expect(betterLabel("right")).toContain("更优");
    expect(betterLabel("tie")).toBe("持平");
    expect(betterLabel("na")).toBe("—");
  });
});
