import { describe, expect, it } from "vitest";
import { runRules, runRulesInBatches } from "@/lib/rules/engine";
import { messyPark } from "@/lib/data/messyPark";
import { cityInfraClean } from "@/lib/data/cityInfraClean";
import { toRuleDataset, makeDataset } from "@/lib/rules/dataset";
import { industrialPark } from "@/lib/data/industrialPark";

describe("runRulesInBatches 分块校验", () => {
  const datasets = [
    makeDataset({}),
    cityInfraClean,
    messyPark,
    toRuleDataset(industrialPark),
  ];

  it("任意分块大小下与 runRules 结果完全等价", () => {
    for (const ds of datasets) {
      const full = runRules(ds);
      for (const batchSize of [1, 3, 8, 50]) {
        const batched = runRulesInBatches(ds, undefined, { batchSize });
        expect(batched.issues).toEqual(full.issues);
        expect(batched.totals).toEqual(full.totals);
        expect(batched.byTable).toEqual(full.byTable);
        expect(batched.byCategory).toEqual(full.byCategory);
        expect(batched.byRule).toEqual(full.byRule);
        expect(batched.ruleCount).toBe(full.ruleCount);
        expect(batched.triggeredRuleCount).toBe(full.triggeredRuleCount);
        expect(batched.passedRuleCount).toBe(full.passedRuleCount);
        expect(batched.skippedRuleCount).toBe(full.skippedRuleCount);
      }
    }
  });

  it("onBatch 进度回调按批触发且终点为规则总数", () => {
    const progress: number[] = [];
    const report = runRulesInBatches(messyPark, undefined, {
      batchSize: 8,
      onBatch: (p) => progress.push(p.completed),
    });
    expect(report.ruleCount).toBe(24);
    expect(progress[progress.length - 1]).toBe(24);
    expect(progress[0]).toBe(8);
    expect(progress).toEqual([8, 16, 24]);
  });

  it("batchSize 小于 1 时按 1 处理", () => {
    const full = runRules(messyPark);
    const batched = runRulesInBatches(messyPark, undefined, { batchSize: 0 });
    expect(batched.issues).toEqual(full.issues);
  });
});
