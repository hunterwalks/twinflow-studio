import type { RuleRecommendation } from "@/lib/quality/recommend";

const PRIO_TONE: Record<string, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-sky-200 bg-sky-50 text-sky-700",
};

const PRIO_LABEL: Record<string, string> = { high: "高", medium: "中", low: "低" };

/** 规则与治理建议列表（确定性推导，可溯源）。 */
export function RuleRecommendations({ recommendations }: { recommendations: RuleRecommendation[] }) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        未检测到需要关注的治理信号。
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">规则与治理建议</h2>
      <p className="mt-1 text-xs text-slate-400">基于当前数据集信号确定性推导，无 AI 判断、不联网。</p>
      <ul className="mt-3 space-y-2">
        {recommendations.map((r, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${PRIO_TONE[r.priority]}`}
            >
              {PRIO_LABEL[r.priority]}
            </span>
            <span className="text-slate-600">{r.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
