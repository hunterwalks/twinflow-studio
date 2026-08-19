import { describe, expect, it } from "vitest";
import { qualityScore, type QualityScore } from "@/lib/quality/score";
import type { Issue, RuleCategory, Severity, ValidationReport } from "@/lib/rules/types";

function mkIssue(severity: Severity, category: RuleCategory): Issue {
  return {
    ruleId: "R",
    ruleName: "规则",
    category,
    severity,
    table: "space",
    scope: "row",
    rowNumber: 1,
    recordId: "X",
    field: "id",
    message: "问题",
    hint: "修复",
  };
}

function makeReport(issues: Issue[]): ValidationReport {
  const totals = { error: 0, warning: 0, info: 0, all: issues.length };
  for (const i of issues) totals[i.severity] += 1;
  return {
    issues,
    totals,
    byTable: { space: 0, asset: 0, sensor: 0, observation: 0 },
    byCategory: {
      completeness: 0,
      uniqueness: 0,
      reference: 0,
      hierarchy: 0,
      coverage: 0,
      convention: 0,
    },
    byRule: [],
    ruleCount: 0,
    triggeredRuleCount: 0,
    passedRuleCount: 0,
    skippedRuleCount: 0,
  };
}

describe("qualityScore 基础", () => {
  it("无问题 -> 100 分 / 等级 A / 无因子", () => {
    const q = qualityScore(makeReport([]));
    expect(q.score).toBe(100);
    expect(q.grade).toBe("A");
    expect(q.factors).toHaveLength(0);
  });

  it("按级别与维度加权扣分", () => {
    const q: QualityScore = qualityScore(
      makeReport([
        mkIssue("error", "completeness"), // 6 * 1.2 = 7.2
        mkIssue("warning", "reference"), // 2.5 * 1.3 = 3.25
        mkIssue("info", "coverage"), // 0.8 * 0.9 = 0.72
      ]),
    );
    // 100 - 7.2 - 3.25 - 0.72 = 88.83 -> 89
    expect(q.score).toBe(89);
    expect(q.grade).toBe("B");
    expect(q.byDimension.completeness.issues).toBe(1);
    expect(q.byDimension.completeness.score).toBeCloseTo(92.8, 2);
    expect(q.byDimension.reference.issues).toBe(1);
    expect(q.byDimension.coverage.issues).toBe(1);
    expect(q.factors).toHaveLength(3);
  });

  it("大量错误 -> 0 分 / 等级 E", () => {
    const issues = Array.from({ length: 30 }, () => mkIssue("error", "uniqueness"));
    const q = qualityScore(makeReport(issues));
    expect(q.score).toBe(0);
    expect(q.grade).toBe("E");
  });

  it("因子按维度分升序（最差在前）", () => {
    const q = qualityScore(
      makeReport([
        mkIssue("error", "completeness"),
        mkIssue("warning", "reference"),
        mkIssue("info", "coverage"),
      ]),
    );
    // completeness(92.8) 最高分，应在因子末尾；reference(96.75) 次之；coverage(99.28) 最高
    expect(q.factors[0].label).toBe("完整性");
    expect(q.factors[q.factors.length - 1].label).toBe("覆盖度");
  });
});
