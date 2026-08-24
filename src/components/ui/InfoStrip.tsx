import type { ReactNode } from "react";
import { CATEGORY_LABEL, type RuleCategory, type ValidationReport } from "@/lib/rules/types";
import type { QualityScore } from "@/lib/quality/score";

interface ColProps {
  cap: string;
  value: ReactNode;
  tone: "brand" | "err" | "warn" | "info" | "ink";
  sub: string;
}

const TONE: Record<ColProps["tone"], string> = {
  brand: "text-brand-700",
  err: "text-err",
  warn: "text-warn",
  info: "text-info",
  ink: "text-ink-1",
};

function Col({ cap, value, tone, sub }: ColProps) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-xs font-medium text-ink-3">{cap}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${TONE[tone]}`}>{value}</p>
      <p className="text-xs text-ink-3">{sub}</p>
    </div>
  );
}

/**
 * 信息条（v1.4 设计系统核心组件）：把校验/报告页面的核心指标收拢为一条 5 列对齐的
 * 指标带（质量评分 / 错误 / 警告 / 提示 / 规则），类别分布下沉为次级行，信息重心清晰。
 */
export function InfoStrip({
  report,
  score,
}: {
  report: ValidationReport;
  score?: QualityScore | null;
}) {
  const t = report.totals;
  return (
    <section
      data-testid="infostrip"
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-card-sm"
    >
      <div className="grid grid-cols-2 divide-x divide-line sm:grid-cols-4 lg:grid-cols-5">
        <Col
          cap="质量评分"
          tone="brand"
          value={score ? score.score : "—"}
          sub={score ? `等级 ${score.grade}` : "暂无"}
        />
        <Col cap="错误" tone="err" value={t.error} sub="需处理" />
        <Col cap="警告" tone="warn" value={t.warning} sub="治理风险" />
        <Col cap="提示" tone="info" value={t.info} sub="覆盖信息" />
        <Col cap="命中规则" tone="ink" value={report.triggeredRuleCount} sub={`共 ${report.ruleCount} 条`} />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line bg-surface-2 px-4 py-2.5 text-xs text-ink-2">
        <span className="font-medium text-ink-3">类别分布</span>
        {(Object.keys(CATEGORY_LABEL) as RuleCategory[]).map((c) => (
          <span key={c}>
            {CATEGORY_LABEL[c]}
            <span className="ml-1.5 font-semibold tabular-nums text-ink-1">{report.byCategory[c]}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
