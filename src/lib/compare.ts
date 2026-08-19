import type { RuleCategory, RuleDataset, Severity } from "@/lib/rules/types";
import { SEVERITY_LABEL, SEVERITY_ORDER } from "@/lib/rules/types";
import { runRules } from "@/lib/rules/engine";
import { qualityScore } from "@/lib/quality/score";

/** 单侧项目画像（跨项目对比的输入）。 */
export interface ProjectProfile {
  label: string;
  counts: { spaces: number; assets: number; sensors: number; observations: number };
  recordCount: number;
  /** 0–100 质量评分 */
  quality: number;
  issues: number;
  bySeverity: Record<Severity, number>;
  byCategory: Record<RuleCategory, number>;
  triggeredRules: number;
  passedRules: number;
  skippedRules: number;
  /** 命中问题数最多的前 3 条规则（按级别 → 数量排序） */
  topRules: { ruleId: string; ruleName: string; count: number }[];
}

/** 由宽松数据集构造项目画像。纯函数、确定性。 */
export function profileDataset(label: string, dataset: RuleDataset): ProjectProfile {
  const report = runRules(dataset);
  const q = qualityScore(report);
  const topRules = report.byRule
    .filter((r) => r.count > 0)
    .sort(
      (x, y) =>
        SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity] || y.count - x.count,
    )
    .slice(0, 3)
    .map((r) => ({ ruleId: r.ruleId, ruleName: r.ruleName, count: r.count }));
  return {
    label,
    counts: {
      spaces: dataset.spaces.length,
      assets: dataset.assets.length,
      sensors: dataset.sensors.length,
      observations: dataset.observations.length,
    },
    recordCount:
      dataset.spaces.length +
      dataset.assets.length +
      dataset.sensors.length +
      dataset.observations.length,
    quality: q.score,
    issues: report.totals.all,
    bySeverity: {
      error: report.totals.error,
      warning: report.totals.warning,
      info: report.totals.info,
    },
    byCategory: { ...report.byCategory },
    triggeredRules: report.triggeredRuleCount,
    passedRules: report.passedRuleCount,
    skippedRules: report.skippedRuleCount,
    topRules,
  };
}

/** 对比行。better 表示哪一侧更优（na = 不适用，tie = 持平）。 */
export interface CompareRow {
  key: string;
  label: string;
  left: string;
  right: string;
  better: "left" | "right" | "tie" | "na";
  /** 指标口径说明（可选）。 */
  hint?: string;
}

type Direction = "higher" | "lower" | "na";

/** 由两侧差值推导「更优方」：higher = 数值大者更优，lower = 数值小者更优。 */
function pick(delta: number, direction: Direction): CompareRow["better"] {
  if (direction === "na") return "na";
  if (delta > 0) return direction === "higher" ? "left" : "right";
  if (delta < 0) return direction === "higher" ? "right" : "left";
  return "tie";
}

const TABLE_ROWS: { key: keyof ProjectProfile["counts"]; label: string }[] = [
  { key: "spaces", label: "空间 Space" },
  { key: "assets", label: "设备 Asset" },
  { key: "sensors", label: "测点 Sensor" },
  { key: "observations", label: "观测 Observation" },
];

/** 生成并排对比行。纯函数、确定性。 */
export function compareProjects(a: ProjectProfile, b: ProjectProfile): CompareRow[] {
  const num = (v: number) => String(v);
  const rows: CompareRow[] = [
    {
      key: "records",
      label: "总记录数",
      left: num(a.recordCount),
      right: num(b.recordCount),
      better: "na",
      hint: "数据规模（非优劣指标）",
    },
    ...TABLE_ROWS.map(({ key, label }) => ({
      key: `count-${key}`,
      label,
      left: num(a.counts[key]),
      right: num(b.counts[key]),
      better: "na" as const,
    })),
    {
      key: "quality",
      label: "质量评分",
      left: `${a.quality}`,
      right: `${b.quality}`,
      better: pick(a.quality - b.quality, "higher"),
      hint: "0–100，越高越好",
    },
    {
      key: "issues",
      label: "问题总数",
      left: num(a.issues),
      right: num(b.issues),
      better: pick(a.issues - b.issues, "lower"),
    },
    ...(Object.keys(SEVERITY_LABEL) as Severity[]).map((sev) => ({
      key: `sev-${sev}`,
      label: `${SEVERITY_LABEL[sev]}问题`,
      left: num(a.bySeverity[sev]),
      right: num(b.bySeverity[sev]),
      better: pick(a.bySeverity[sev] - b.bySeverity[sev], "lower"),
    })),
    {
      key: "triggered",
      label: "命中规则数",
      left: num(a.triggeredRules),
      right: num(b.triggeredRules),
      better: pick(a.triggeredRules - b.triggeredRules, "lower"),
    },
    {
      key: "passed",
      label: "通过规则数",
      left: num(a.passedRules),
      right: num(b.passedRules),
      better: pick(a.passedRules - b.passedRules, "higher"),
    },
    {
      key: "skipped",
      label: "跳过规则数",
      left: num(a.skippedRules),
      right: num(b.skippedRules),
      better: "na",
      hint: "被引用表为空时规则跳过，非优劣指标",
    },
  ];
  return rows;
}

/** 「更优方」的人类可读标签。 */
export function betterLabel(better: CompareRow["better"]): string {
  if (better === "left") return "← 更优";
  if (better === "right") return "→ 更优";
  if (better === "tie") return "持平";
  return "—";
}
