import type { Column, Row } from "@/lib/table";

interface DataTableProps {
  title: string;
  columns: Column[];
  rows: Row[];
}

/** 工作表式数据预览：表头 + 行网格，列可横向滚动。 */
export function DataTable({ title, columns, rows }: DataTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400">{rows.length} 行</span>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">当前对象类型没有可预览的记录。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="whitespace-nowrap border-b border-slate-200 px-4 py-2 font-medium text-slate-500"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-700"
                    >
                      {row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
