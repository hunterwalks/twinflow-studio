import { SeverityBadge } from "./SeverityBadge";
import { CATEGORY_LABEL, type RuleSummary } from "@/lib/rules/types";

/** 规则维度汇总：每条规则的命中数或跳过原因。 */
export function RuleSummaryTable({ rows }: { rows: RuleSummary[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">规则维度汇总</h3>
        <span className="text-xs text-slate-400">{rows.length} 条规则</span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                规则
              </th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                类别
              </th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                级别
              </th>
              <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                结果
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ruleId} className="hover:bg-slate-50">
                <td className="border-b border-slate-100 px-4 py-2 text-slate-700">
                  <span className="font-mono text-xs text-slate-400">{r.ruleId}</span>
                  <span className="ml-2">{r.ruleName}</span>
                </td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-500">
                  {CATEGORY_LABEL[r.category]}
                </td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2">
                  <SeverityBadge severity={r.severity} />
                </td>
                <td className="border-b border-slate-100 px-4 py-2">
                  {r.skipped ? (
                    <span className="text-xs text-slate-400">已跳过 · {r.skipped}</span>
                  ) : r.count > 0 ? (
                    <span className="font-medium text-slate-800">命中 {r.count} 处</span>
                  ) : (
                    <span className="text-emerald-600">通过</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
