import { describe, expect, it } from "vitest";
import { levenshtein, normalizeLoose, similarity } from "@/lib/import/similarity";
import {
  scoreHeaderAgainstField,
  suggestMappings,
  type MappingMethod,
} from "@/lib/import/mapping";
import type { TargetField } from "@/lib/import/fieldTargets";

describe("similarity 基础", () => {
  it("normalizeLoose 去空白与标点并小写", () => {
    expect(normalizeLoose("  Space-ID ")).toBe("spaceid");
    expect(normalizeLoose("空间 / 名称（A）")).toBe("空间名称a");
  });

  it("levenshtein 经典用例", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("abc", "abc")).toBe(0);
    expect(levenshtein("", "abc")).toBe(3);
  });

  it("similarity 相等为 1，无重叠为 0", () => {
    expect(similarity("ID", "id")).toBe(1);
    expect(similarity("abc", "xyz")).toBe(0);
  });

  it("similarity 子串增强：短串是长串子串时给高分", () => {
    // 空间名(3) 是 空间名称(4) 的子串 -> 0.5 + 0.5*(3/4) = 0.875
    expect(similarity("空间名", "空间名称")).toBe(0.875);
  });
});

describe("scoreHeaderAgainstField 三档判定", () => {
  const f: TargetField = { key: "k", label: "K", required: false, aliases: ["abcde"] };

  it("精确匹配 -> exact / 1", () => {
    expect(scoreHeaderAgainstField("abcde", f)).toEqual({ score: 1, method: "exact" });
  });

  it("子串近似（>=0.85 但非精确）-> normalized", () => {
    // abcd(4) 是 abcde(5) 子串 -> 0.5 + 0.5*(4/5) = 0.9
    expect(scoreHeaderAgainstField("abcd", f)).toEqual({ score: 0.9, method: "normalized" });
  });

  it("模糊但 >=0.6 -> fuzzy", () => {
    // abcdf vs abcde：编辑距离 1，比率 0.8
    expect(scoreHeaderAgainstField("abcdf", f)).toEqual({ score: 0.8, method: "fuzzy" });
  });

  it("低于阈值 -> none / 0", () => {
    expect(scoreHeaderAgainstField("zzz", f)).toEqual({ score: 0, method: "none" });
  });
});

describe("suggestMappings 置信度与自动映射", () => {
  it("精确表头全部高置信自动映射", () => {
    const s = suggestMappings("space", ["ID", "名称", "类型", "父级ID", "描述"]);
    expect(s.high).toBe(5);
    expect(s.medium).toBe(0);
    expect(s.low).toBe(0);
    expect(s.mapping["ID"]).toBe("id");
    expect(s.mapping["名称"]).toBe("name");
    expect(s.mapping["描述"]).toBe("description");
  });

  it("模糊表头中置信自动映射并标记需复核", () => {
    const s = suggestMappings("asset", ["assetyyp"]);
    // 单表头只会映射到一个字段；该字段应为模糊匹配（0.6–0.85）且标记需复核
    const mapped = s.suggestions.find((x) => x.source != null);
    expect(mapped?.method).toBe<MappingMethod>("fuzzy");
    expect(mapped?.score).toBeGreaterThanOrEqual(0.6);
    expect(mapped?.score).toBeLessThan(0.85);
    expect(mapped?.needsReview).toBe(true);
    expect(s.medium).toBe(1);
    expect(s.low).toBe(4);
  });

  it("完全无关表头全部低置信（不自动映射）", () => {
    const s = suggestMappings("space", ["乱七八糟"]);
    expect(s.low).toBe(5);
    expect(s.high).toBe(0);
    expect(s.mapping["乱七八糟"]).toBeNull();
  });

  it("一对一：同一源列不被两个目标复用", () => {
    const s = suggestMappings("space", ["ID", "名称", "类型", "父级ID", "描述"]);
    const targets = Object.values(s.mapping).filter(Boolean);
    expect(new Set(targets).size).toBe(targets.length);
  });
});
