import { CATEGORY_LABEL, type RuleCategory, type Severity } from "@/lib/rules/types";
import type { QualityScore } from "@/lib/quality/score";

const GRADE_TONE: Record<string, string> = {
  A: "border-emerald-200 bg-emerald-50 text-emerald-700",
  B: "border-teal-200 bg-teal-50 text-teal-700",
  C: "border-amber-200 bg-amber-50 text-amber-700",
  D: "border-orange-200 bg-orange-50 text-orange-700",
  E: "border-red-200 bg-red-50 text-red-700",
};

const SEV_BAR: Record<Severity, string> = {
  error: "#dc2626",
  warning: "#d97706",
  info: "#0ea5e9",
};

function barColor(worst: Severity | null): string {
  if (worst == null) return "#10b981";
  return SEV_BAR[worst];
}

/** 数据质量评分卡片：总分 / 等级 / 按维度明细 / 主要扣分项。 */
export function QualityScoreCard({ score }: { score: QualityScore }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">数据质量评分</h2>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${GRADE_TONE[score.grade]}`}>
          等级 {score.grade}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <p className="text-4xl font-bold text-slate-900">{score.score}</p>
        <p className="mb-1 text-sm text-slate-400">/ 100</p>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        由 {score.counts.all} 个校验问题聚合（错误 {score.counts.error} · 警告 {score.counts.warning} · 提示{" "}
        {score.counts.info}）
      </p>

      <div className="mt-4 space-y-2">
        {(Object.keys(CATEGORY_LABEL) as RuleCategory[]).map((c) => {
          const d = score.byDimension[c];
          const pct = Math.round(d.score);
          return (
            <div key={c} className="flex items-center gap-3 text-xs">
              <span className="w-16 shrink-0 text-slate-500">{CATEGORY_LABEL[c]}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-slate-100">
                <div
                  className="h-2 rounded"
                  style={{ width: `${pct}%`, backgroundColor: barColor(d.worst) }}
                />
              </div>
              <span className="w-8 text-right text-slate-500">{pct}</span>
              <span className="w-12 text-right text-slate-400">{d.issues} 项</span>
            </div>
          );
        })}
      </div>

      {score.factors.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500">主要扣分项</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-600">
            {score.factors.map((f, i) => (
              <li key={i}>
                <span className="font-medium text-slate-700">{f.label}</span>：{f.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
