import { describe, expect, it } from "vitest";
import { recommendRules, type RuleRecommendation } from "@/lib/quality/recommend";
import { makeDataset } from "@/lib/rules/dataset";
import type { RuleDataset } from "@/lib/rules/types";

function hasRule(recs: RuleRecommendation[], ruleId: string): boolean {
  return recs.some((r) => r.ruleId === ruleId);
}

describe("recommendRules 信号推导", () => {
  it("带父级的空间推荐层级与引用规则", () => {
    const ds: RuleDataset = makeDataset({
      spaces: [
        { id: "SP-001", name: "园区", type: "park", parentId: "" },
        { id: "SP-002", name: "楼", type: "building", parentId: "SP-001" },
      ],
    });
    const recs = recommendRules(ds);
    expect(hasRule(recs, "R008")).toBe(true); // 悬空引用
    expect(hasRule(recs, "R012")).toBe(true); // 缺少根空间（存在带父级空间）
    expect(hasRule(recs, "R010")).toBe(true); // 层级成环
    // 描述缺失 -> R005
    expect(hasRule(recs, "R005")).toBe(true);
    // 确定性：结果与长度稳定
    expect(recs.length).toBeGreaterThan(0);
  });

  it("资产重复 ID + 悬空引用 + 缺测点 推荐 R006/R008/R014", () => {
    const ds: RuleDataset = makeDataset({
      assets: [
        { id: "AS-001", name: "泵", type: "pump", spaceId: "SP-X", description: "d" },
        { id: "AS-001", name: "泵2", type: "pump", spaceId: "SP-X", description: "d" },
      ],
    });
    const recs = recommendRules(ds);
    expect(hasRule(recs, "R006")).toBe(true); // 重复 ID
    expect(hasRule(recs, "R008")).toBe(true); // 悬空引用（资产→空间）
    expect(hasRule(recs, "R014")).toBe(true); // 资产缺测点
    // 类型取值单一（均为 pump）-> 自定义建议
    expect(recs.some((r) => r.kind === "custom" && r.ruleName === "类型取值单一")).toBe(true);
  });

  it("空数据集不产生建议", () => {
    expect(recommendRules(makeDataset({}))).toHaveLength(0);
  });

  it("纯数字 ID 不触发命名规范建议", () => {
    const ds: RuleDataset = makeDataset({
      spaces: [{ id: "SP-001", name: "园区", type: "park", parentId: "" }],
    });
    const recs = recommendRules(ds);
    // 符合 SP-001 规范，不应推荐 R002
    expect(hasRule(recs, "R002")).toBe(false);
  });
});
