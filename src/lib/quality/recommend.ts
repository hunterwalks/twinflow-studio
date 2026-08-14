/**
 * 规则建议引擎（v0.5.0）
 * 扫描宽松数据集中的信号，推荐「应当启用的内置校验规则」与「自定义治理建议」。
 *
 * 设计原则：
 * - 纯函数、确定性：同一份数据集必然得到同一组建议，且顺序稳定。
 * - 无 AI、无网络：基于字段空值、重复、引用、层级、覆盖等可观察信号推导。
 * - 可溯源：每条建议都给出中文原因，指向具体表 / 字段 / 规则。
 */

import { fieldLabel, ID_PATTERN, REQUIRED_FIELDS } from "../rules/spec";
import { raw, val } from "../rules/dataset";
import {
  TABLE_LABEL,
  type RuleCategory,
  type RuleDataset,
  type TableName,
} from "../rules/types";

export type RecommendKind = "builtin" | "custom";
export type RecommendPriority = "high" | "medium" | "low";

export interface RuleRecommendation {
  /** 关联的内置规则 ID；自定义建议为 null */
  ruleId: string | null;
  ruleName: string;
  category: RuleCategory | "custom";
  priority: RecommendPriority;
  kind: RecommendKind;
  /** 中文原因（可溯源到表 / 字段 / 规则） */
  reason: string;
}

const PRIORITY_RANK: Record<RecommendPriority, number> = { high: 0, medium: 1, low: 2 };
const CATEGORY_RANK: Record<string, number> = {
  completeness: 0,
  uniqueness: 1,
  reference: 2,
  hierarchy: 3,
  coverage: 4,
  convention: 5,
  custom: 6,
};

/** 基于数据集信号生成规则与治理建议（确定性、可排序）。 */
export function recommendRules(dataset: RuleDataset): RuleRecommendation[] {
  const recs: RuleRecommendation[] = [];
  const seen = new Set<string>();
  const push = (r: RuleRecommendation) => {
    const key = `${r.kind}:${r.ruleId ?? "custom"}:${r.category}:${r.reason}`;
    if (seen.has(key)) return;
    seen.add(key);
    recs.push(r);
  };

  const tables: TableName[] = ["space", "asset", "sensor"];
  const PLURAL: Record<TableName, "spaces" | "assets" | "sensors"> = {
    space: "spaces",
    asset: "assets",
    sensor: "sensors",
  };

  for (const t of tables) {
    const records = dataset[PLURAL[t]];
    if (records.length === 0) continue;
    const label = TABLE_LABEL[t];

    // 必填字段缺失 -> R001（整表只报一条，避免刷屏）
    for (const f of REQUIRED_FIELDS[t]) {
      const empty = records.filter((r) => val(r, f) === "").length;
      if (empty > 0) {
        push({
          ruleId: "R001",
          ruleName: "必填字段为空",
          category: "completeness",
          priority: "high",
          kind: "builtin",
          reason: `检测到 ${empty} 条${label}记录缺少必填字段「${fieldLabel(f)}」，建议启用完整性校验（R001）。`,
        });
        break;
      }
    }

    // 重复 ID -> R006
    const ids = records.map((r) => val(r, "id")).filter((v) => v !== "");
    const dupIds = ids.length - new Set(ids).size;
    if (dupIds > 0) {
      push({
        ruleId: "R006",
        ruleName: "ID 重复",
        category: "uniqueness",
        priority: "high",
        kind: "builtin",
        reason: `存在 ${dupIds} 个重复 ID，建议启用唯一性校验（R006）。`,
      });
    }

    // 描述缺失 -> R005（提示级）
    const descMissing = records.filter((r) => val(r, "description") === "").length;
    if (descMissing > 0) {
      push({
        ruleId: "R005",
        ruleName: "描述缺失",
        category: "completeness",
        priority: "low",
        kind: "builtin",
        reason: `有 ${descMissing} 条${label}记录缺少描述信息，建议启用描述完整性检查（R005）。`,
      });
    }

    // 引用与层级相关
    if (t === "space") {
      const hasParent = records.some((r) => val(r, "parentId") !== "");
      if (hasParent) {
        push({
          ruleId: "R008",
          ruleName: "悬空引用",
          category: "reference",
          priority: "high",
          kind: "builtin",
          reason: "空间存在父级引用，建议启用悬空引用与自引用校验（R008 / R009）。",
        });
        push({
          ruleId: "R012",
          ruleName: "缺少根空间",
          category: "hierarchy",
          priority: "high",
          kind: "builtin",
          reason: "存在带父级的空间，建议校验是否存在根空间（R012）。",
        });
        push({
          ruleId: "R010",
          ruleName: "层级成环",
          category: "hierarchy",
          priority: "medium",
          kind: "builtin",
          reason: "存在层级关系，建议启用层级成环校验（R010）。",
        });
        push({
          ruleId: "R011",
          ruleName: "层级倒置",
          category: "hierarchy",
          priority: "medium",
          kind: "builtin",
          reason: "存在层级关系，建议启用层级深度倒置校验（R011）。",
        });
      }
    } else if (t === "asset") {
      const hasSpace = records.some((r) => val(r, "spaceId") !== "");
      if (hasSpace) {
        push({
          ruleId: "R008",
          ruleName: "悬空引用",
          category: "reference",
          priority: "high",
          kind: "builtin",
          reason: "资产引用了空间，建议启用资产→空间悬空引用校验（R008）。",
        });
      }
    } else if (t === "sensor") {
      const hasAsset = records.some((r) => val(r, "assetId") !== "");
      if (hasAsset) {
        push({
          ruleId: "R008",
          ruleName: "悬空引用",
          category: "reference",
          priority: "high",
          kind: "builtin",
          reason: "测点引用了资产，建议启用测点→资产悬空引用校验（R008）。",
        });
        push({
          ruleId: "R015",
          ruleName: "量纲单位不匹配",
          category: "convention",
          priority: "medium",
          kind: "builtin",
          reason: "测点含量纲与单位，建议启用量纲-单位匹配校验（R015）。",
        });
      }
    }
  }

  // 跨表覆盖：资产存在但测点缺失 -> R014
  if (dataset.assets.length > 0 && dataset.sensors.length === 0) {
    push({
      ruleId: "R014",
      ruleName: "资产缺少测点",
      category: "coverage",
      priority: "medium",
      kind: "builtin",
      reason: `存在 ${dataset.assets.length} 个资产但缺少测点，建议启用资产-测点覆盖校验（R014）。`,
    });
  }

  // 自定义：类型取值单一
  for (const t of tables) {
    const records = dataset[PLURAL[t]];
    if (records.length <= 1) continue;
    const types = new Set(records.map((r) => val(r, "type")).filter((v) => v !== ""));
    if (types.size <= 1) {
      const only = [...types][0] ?? "（空）";
      push({
        ruleId: null,
        ruleName: "类型取值单一",
        category: "custom",
        priority: "low",
        kind: "custom",
        reason: `${TABLE_LABEL[t]}的「类型」取值单一（仅「${only}」），建议补充类型枚举规范说明。`,
      });
    }
  }

  // 自定义：ID 命名不统一 -> 推荐 R002
  for (const t of tables) {
    const ids = dataset[PLURAL[t]].map((r) => raw(r, "id")).filter((v) => v.trim() !== "");
    if (ids.length === 0) continue;
    const match = ids.filter((v) => ID_PATTERN.test(v.trim())).length;
    if (match > 0 && match < ids.length) {
      push({
        ruleId: "R002",
        ruleName: "ID 命名不规范",
        category: "convention",
        priority: "medium",
        kind: "builtin",
        reason: `ID 命名不统一（${match}/${ids.length} 符合 SP-001 规范），建议启用命名规范校验（R002）。`,
      });
    }
  }

  recs.sort((a, b) => {
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (p !== 0) return p;
    const c = (CATEGORY_RANK[a.category] ?? 9) - (CATEGORY_RANK[b.category] ?? 9);
    if (c !== 0) return c;
    return (a.ruleId ?? "zzz").localeCompare(b.ruleId ?? "zzz");
  });

  return recs;
}
