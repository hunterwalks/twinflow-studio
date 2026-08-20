/**
 * 校验规则引擎（v0.3.0）
 *
 * 纯函数：runRules(dataset) 对同一输入必然产出同一问题集合与同一排序。
 * 排序键：级别 → 表 → 行号（整表级问题排在该表最前）→ 规则 ID → 字段。
 */

import { buildContext } from "./dataset";
import { ALL_RULES } from "./registry";
import {
  SEVERITY_ORDER,
  TABLE_ORDER,
  type Issue,
  type RuleCategory,
  type Rule,
  type RuleDataset,
  type RuleSummary,
  type Severity,
  type TableName,
  type ValidationReport,
} from "./types";

/** 问题比较函数，保证输出顺序确定。 */
export function compareIssues(a: Issue, b: Issue): number {
  const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  if (sev !== 0) return sev;

  const tbl = TABLE_ORDER[a.table] - TABLE_ORDER[b.table];
  if (tbl !== 0) return tbl;

  // 整表级问题（rowNumber 为 null）排在该表最前
  const ra = a.rowNumber ?? 0;
  const rb = b.rowNumber ?? 0;
  if (ra !== rb) return ra - rb;

  if (a.ruleId !== b.ruleId) return a.ruleId < b.ruleId ? -1 : 1;

  const fa = a.field ?? "";
  const fb = b.field ?? "";
  if (fa !== fb) return fa < fb ? -1 : 1;

  return 0;
}

function zeroSeverity(): Record<Severity, number> & { all: number } {
  return { error: 0, warning: 0, info: 0, all: 0 };
}

function zeroTable(): Record<TableName, number> {
  return { space: 0, asset: 0, sensor: 0, observation: 0 };
}

function zeroCategory(): Record<RuleCategory, number> {
  return {
    completeness: 0,
    uniqueness: 0,
    reference: 0,
    hierarchy: 0,
    coverage: 0,
    convention: 0,
  };
}

/** 对数据集执行规则集，产出可溯源的校验报告。 */
export function runRules(dataset: RuleDataset, rules: Rule[] = ALL_RULES): ValidationReport {
  const ctx = buildContext(dataset);

  const issues: Issue[] = [];
  const byRule: RuleSummary[] = [];
  let skippedRuleCount = 0;
  let triggeredRuleCount = 0;
  let passedRuleCount = 0;

  for (const rule of rules) {
    const skipped = rule.skipReason ? rule.skipReason(ctx) : null;
    if (skipped) {
      skippedRuleCount += 1;
      byRule.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        severity: rule.severity,
        count: 0,
        skipped,
      });
      continue;
    }

    const produced = rule.run(ctx);
    issues.push(...produced);
    if (produced.length > 0) triggeredRuleCount += 1;
    else passedRuleCount += 1;

    byRule.push({
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      count: produced.length,
      skipped: null,
    });
  }

  issues.sort(compareIssues);

  const totals = zeroSeverity();
  const byTable = zeroTable();
  const byCategory = zeroCategory();
  for (const issue of issues) {
    totals[issue.severity] += 1;
    totals.all += 1;
    byTable[issue.table] += 1;
    byCategory[issue.category] += 1;
  }

  return {
    issues,
    totals,
    byTable,
    byCategory,
    byRule,
    ruleCount: rules.length,
    triggeredRuleCount,
    passedRuleCount,
    skippedRuleCount,
  };
}

/** 分块校验进度回调。 */
export interface BatchProgress {
  /** 已完成的规则数 */
  completed: number;
  /** 规则总数 */
  total: number;
}

export interface BatchOptions {
  /** 每批规则数（默认 8） */
  batchSize?: number;
  /** 每批完成后回调（供 UI 展示进度 / 让出主线程） */
  onBatch?: (progress: BatchProgress) => void;
}

/**
 * 分块校验（v1.0.0）：按规则分批执行并合并，结果与 runRules 完全等价（确定性）。
 * 适用于大表场景：可在批次之间让出主线程（async 包装）或展示进度。
 * 合并逻辑保持规则原始顺序：issues 统一按 compareIssues 排序，计数重新汇总。
 */
export function runRulesInBatches(
  dataset: RuleDataset,
  rules: Rule[] = ALL_RULES,
  opts?: BatchOptions,
): ValidationReport {
  const batchSize = Math.max(1, opts?.batchSize ?? 8);
  const total = rules.length;

  let allIssues: Issue[] = [];
  let byRule: RuleSummary[] = [];
  let triggeredRuleCount = 0;
  let passedRuleCount = 0;
  let skippedRuleCount = 0;

  for (let i = 0; i < total; i += batchSize) {
    const chunk = rules.slice(i, i + batchSize);
    const report = runRules(dataset, chunk);
    allIssues = allIssues.concat(report.issues);
    byRule = byRule.concat(report.byRule);
    triggeredRuleCount += report.triggeredRuleCount;
    passedRuleCount += report.passedRuleCount;
    skippedRuleCount += report.skippedRuleCount;
    opts?.onBatch?.({ completed: Math.min(total, i + chunk.length), total });
  }

  allIssues.sort(compareIssues);

  const totals = zeroSeverity();
  const byTable = zeroTable();
  const byCategory = zeroCategory();
  for (const issue of allIssues) {
    totals[issue.severity] += 1;
    totals.all += 1;
    byTable[issue.table] += 1;
    byCategory[issue.category] += 1;
  }

  return {
    issues: allIssues,
    totals,
    byTable,
    byCategory,
    byRule,
    ruleCount: total,
    triggeredRuleCount,
    passedRuleCount,
    skippedRuleCount,
  };
}

/** 按级别筛选问题。 */
export function filterBySeverity(issues: Issue[], severity: Severity | "all"): Issue[] {
  if (severity === "all") return issues;
  return issues.filter((i) => i.severity === severity);
}

/** 按表筛选问题。 */
export function filterByTable(issues: Issue[], table: TableName | "all"): Issue[] {
  if (table === "all") return issues;
  return issues.filter((i) => i.table === table);
}

/** 问题溯源文本，例如「空间 Space · 第 3 行 · 父级ID」。 */
export function traceText(issue: Issue): string {
  const parts: string[] = [];
  parts.push(issue.scope === "table" ? "整表" : `第 ${issue.rowNumber} 行`);
  if (issue.recordId) parts.push(issue.recordId);
  if (issue.field) parts.push(issue.field);
  return parts.join(" · ");
}

/** 是否存在阻断级问题（error）。 */
export function hasBlockingIssues(report: ValidationReport): boolean {
  return report.totals.error > 0;
}
