import { SeverityBadge } from "./SeverityBadge";
import { fieldLabel } from "@/lib/rules/spec";
import { TABLE_LABEL, type Issue } from "@/lib/rules/types";
import type { ProposedFix } from "@/lib/fixes";

interface IssueTableProps {
  title: string;
  issues: Issue[];
  /** 最多展示条数，超出给出提示 */
  limit?: number;
  /**
   * 可选的修复解析器：传入后为「可自动修复」的问题渲染 before→after 预览与「应用」按钮。
   * 返回 null 表示该问题不可自动修复（需用户手动处理）。
   */
  fixResolver?: (issue: Issue) => ProposedFix | null;
  /** 应用一条确定性修复（由修复预览按钮触发）。 */
  onApplyFix?: (fix: ProposedFix) => void;
}

/** 问题清单：每行可溯源到「表 / 行号 / 记录ID / 字段」。 */
export function IssueTable({ title, issues, limit = 200, fixResolver, onApplyFix }: IssueTableProps) {
  const shown = issues.slice(0, limit);
  return (
    <section data-testid="issue-table" className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400">{issues.length} 条</span>
      </header>

      {issues.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">
          当前筛选条件下没有问题。
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                  级别
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                  规则
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                  表
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                  行号
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                  记录ID
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                  字段
                </th>
                <th className="border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                  问题与修复建议
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((issue, idx) => {
                const fix = fixResolver ? fixResolver(issue) : null;
                const canFix = !!fix && !!onApplyFix;
                return (
                <tr key={`${issue.ruleId}-${issue.table}-${issue.rowNumber}-${issue.field}-${idx}`} className="align-top hover:bg-slate-50">
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2">
                    <SeverityBadge severity={issue.severity} />
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2">
                    <span className="font-mono text-xs text-slate-400">{issue.ruleId}</span>
                    <span className="ml-2 text-slate-600">{issue.ruleName}</span>
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-600">
                    {TABLE_LABEL[issue.table]}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 font-mono text-xs text-slate-600">
                    {issue.scope === "table" ? "整表" : `第 ${issue.rowNumber} 行`}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 font-mono text-xs text-slate-600">
                    {issue.recordId ?? "—"}
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-600">
                    {issue.field ? fieldLabel(issue.field) : "—"}
                  </td>
                  <td className="border-b border-slate-100 px-4 py-2 text-slate-700">
                    <p>{issue.message}</p>
                    <p className="mt-1 text-xs text-slate-400">建议：{issue.hint}</p>
                    {canFix && fix && (
                      <div
                        data-testid={`fix-preview-${issue.ruleId}-${issue.rowNumber ?? "table"}`}
                        className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                      >
                        <p>
                          可自动修复：{fieldLabel(fix.field)} 「
                          <span className="font-mono">{fix.current || "（空）"}</span>」 → 「
                          <span className="font-mono">{fix.proposed || "（根节点）"}</span>」
                        </p>
                        <button
                          type="button"
                          data-testid={`fix-apply-${issue.ruleId}-${issue.rowNumber ?? "table"}`}
                          onClick={() => onApplyFix?.(fix)}
                          className="mt-2 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          应用修复
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {issues.length > shown.length && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          仅展示前 {shown.length} 条，共 {issues.length} 条。
        </p>
      )}
    </section>
  );
}
