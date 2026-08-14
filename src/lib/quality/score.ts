/**
 * 数据质量评分（v0.5.0）
 * 将校验报告聚合为一个 0–100 的总分、等级（A–E）与按类别维度的扣分明细。
 *
 * 设计原则：
 * - 纯函数、确定性：同一份报告必然得到同一分数与同一明细。
 * - 无 AI、无网络：基于校验报告中已知的 issue 级别与类别做加权扣分。
 * - 可解释：每条扣分都可追溯到「哪个维度、多少问题、权重多少」。
 */

import {
  CATEGORY_LABEL,
  type RuleCategory,
  type Severity,
  type ValidationReport,
} from "../rules/types";

/** 质量等级。 */
export type QualityGrade = "A" | "B" | "C" | "D" | "E";

/** 各级别单条问题的扣分权重。 */
export const SEVERITY_PENALTY: Record<Severity, number> = {
  error: 6,
  warning: 2.5,
  info: 0.8,
};

/** 各维度对总分的相对权重（仅影响维度分与扣分排序，不影响总分归一化）。 */
export const DIMENSION_WEIGHT: Record<RuleCategory, number> = {
  completeness: 1.2,
  uniqueness: 1.1,
  reference: 1.3,
  hierarchy: 1.0,
  coverage: 0.9,
  convention: 0.7,
};

/** 单个维度的评分明细。 */
export interface DimensionScore {
  category: RuleCategory;
  /** 该维度得分（0–100，越高越好） */
  score: number;
  /** 该维度问题数 */
  issues: number;
  /** 该维度权重 */
  weight: number;
  /** 该维度最严重的问题级别 */
  worst: Severity | null;
}

/** 扣分因子（用于解释「为什么被扣分」）。 */
export interface QualityFactor {
  label: string;
  detail: string;
  severity: Severity;
}

/** 完整质量评分结果。 */
export interface QualityScore {
  /** 0–100 的总分 */
  score: number;
  grade: QualityGrade;
  byDimension: Record<RuleCategory, DimensionScore>;
  factors: QualityFactor[];
  counts: Record<Severity, number> & { all: number };
}

function gradeOf(score: number): QualityGrade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "E";
}

function worstOf(a: Severity | null, b: Severity): Severity {
  const order: Severity[] = ["error", "warning", "info"];
  if (a == null) return b;
  return order.indexOf(b) < order.indexOf(a) ? b : a;
}

/** 由校验报告计算数据质量评分。 */
export function qualityScore(report: ValidationReport): QualityScore {
  const byDimension = {} as Record<RuleCategory, DimensionScore>;
  for (const c of Object.keys(CATEGORY_LABEL) as RuleCategory[]) {
    byDimension[c] = {
      category: c,
      score: 100,
      issues: 0,
      weight: DIMENSION_WEIGHT[c],
      worst: null,
    };
  }

  let totalPenalty = 0;
  for (const issue of report.issues) {
    const pen = SEVERITY_PENALTY[issue.severity] * DIMENSION_WEIGHT[issue.category];
    const dim = byDimension[issue.category];
    dim.issues += 1;
    dim.score = Math.max(0, Math.round((dim.score - pen) * 1000) / 1000);
    dim.worst = worstOf(dim.worst, issue.severity);
    totalPenalty += pen;
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - totalPenalty)));
  const grade = gradeOf(score);
  const factors = buildFactors(byDimension);

  return {
    score,
    grade,
    byDimension,
    factors,
    counts: { ...report.totals },
  };
}

/** 取问题最严重的若干维度作为扣分因子（最多 4 条），按维度分升序。 */
function buildFactors(byDimension: Record<RuleCategory, DimensionScore>): QualityFactor[] {
  return (Object.keys(byDimension) as RuleCategory[])
    .map((c) => byDimension[c])
    .filter((d) => d.issues > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((d) => ({
      label: CATEGORY_LABEL[d.category],
      detail: `发现 ${d.issues} 个问题（维度权重 ${d.weight}）`,
      severity: d.worst ?? "info",
    }));
}
