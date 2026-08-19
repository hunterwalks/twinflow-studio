import { describe, it, expect } from "vitest";
import { buildReport } from "@/lib/report/build";
import { makeDataset, toRuleDataset } from "@/lib/rules/dataset";
import { industrialPark } from "@/lib/data/industrialPark";

const SAME_TIME = "2026-08-14T00:00:00.000Z";

describe("buildReport", () => {
  it("空数据集：质量满分 A、无问题、无建议", () => {
    const r = buildReport({ dataset: makeDataset({}), source: "测试", generatedAt: SAME_TIME });
    expect(r.meta.version).toBe("0.6.0");
    expect(r.meta.source).toBe("测试");
    expect(r.meta.recordCount.total).toBe(0);
    expect(r.quality.score).toBe(100);
    expect(r.quality.grade).toBe("A");
    expect(r.validation.totals.all).toBe(0);
    expect(r.recommendations).toHaveLength(0);
  });

  it("确定性：相同输入与生成时间得到完全相同的报告", () => {
    const ds = toRuleDataset(industrialPark);
    const a = buildReport({ dataset: ds, generatedAt: SAME_TIME });
    const b = buildReport({ dataset: ds, generatedAt: SAME_TIME });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("重复 ID 触发 R006 建议并产生错误级问题", () => {
    const ds = makeDataset({
      spaces: [
        { id: "SP-1", name: "A", type: "园区", parentId: "", description: "" },
        { id: "SP-1", name: "B", type: "园区", parentId: "", description: "" },
      ],
    });
    const r = buildReport({ dataset: ds, generatedAt: SAME_TIME });
    expect(r.recommendations.some((x) => x.ruleId === "R006")).toBe(true);
    expect(r.validation.totals.error).toBeGreaterThan(0);
  });

  it("记录数汇总正确", () => {
    const ds = makeDataset({
      spaces: [{ id: "SP-1", name: "a", type: "园区", parentId: "", description: "" }],
      assets: [{ id: "AS-1", name: "b", type: "设备", spaceId: "SP-1", description: "" }],
      sensors: [{ id: "SE-1", name: "c", assetId: "AS-1", quantity: "温度", unit: "℃", description: "" }],
    });
    const r = buildReport({ dataset: ds, generatedAt: SAME_TIME });
    expect(r.meta.recordCount).toEqual({ spaces: 1, assets: 1, sensors: 1, observations: 0, total: 3 });
  });
});
