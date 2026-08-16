import { SEVERITY_LABEL, type ValidationReport } from "@/lib/rules/types";

const CARD: Record<string, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  clean: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

function Card({ tone, label, value }: { tone: string; label: string; value: string | number }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${CARD[tone]}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-0.5 text-xl font-semibold">{value}</p>
    </div>
  );
}

/** 分级汇总与规则执行情况。 */
export function ValidationSummary({ report }: { report: ValidationReport }) {
  const clean = report.totals.all === 0;
  return (
    <div data-testid="validation-summary" className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Card tone="error" label={SEVERITY_LABEL.error} value={report.totals.error} />
        <Card tone="warning" label={SEVERITY_LABEL.warning} value={report.totals.warning} />
        <Card tone="info" label={SEVERITY_LABEL.info} value={report.totals.info} />
        <Card tone={clean ? "clean" : "neutral"} label="问题合计" value={report.totals.all} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Card tone="neutral" label="规则总数" value={report.ruleCount} />
        <Card tone="neutral" label="命中规则" value={report.triggeredRuleCount} />
        <Card tone="neutral" label="通过规则" value={report.passedRuleCount} />
        <Card tone="neutral" label="跳过规则" value={report.skippedRuleCount} />
      </div>

      {clean && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          未发现问题：{report.passedRuleCount} 条规则全部通过
          {report.skippedRuleCount > 0 && `，${report.skippedRuleCount} 条因数据不足被跳过`}。
        </p>
      )}
    </div>
  );
}
