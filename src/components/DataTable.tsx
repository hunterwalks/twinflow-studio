"use client";

import { useMemo, useState } from "react";
import type { Column, Row } from "@/lib/table";
import { visibleRange } from "@/lib/table";

interface DataTableProps {
  title: string;
  columns: Column[];
  rows: Row[];
}

/** 超过该行数启用虚拟滚动（固定行高窗口化渲染）。 */
const VIRTUAL_THRESHOLD = 100;
/** 固定行高（px）：py-2(16) + 行文本(~20) + 边框(1) */
const ROW_HEIGHT = 41;
/** 滚动视口高度（px）：对应 max-h-96 */
const VIEWPORT_HEIGHT = 384;

/**
 * 工作表式数据预览：表头 + 行网格，列可横向滚动。
 * v1.0.0 起：超过 VIRTUAL_THRESHOLD 行时启用虚拟滚动，仅渲染可视区间行，
 * 通过容器内偏移保持滚动条与绝对定位正确，大幅降低大表渲染成本。
 */
export function DataTable({ title, columns, rows }: DataTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const virtual = rows.length > VIRTUAL_THRESHOLD;

  const range = useMemo(() => {
    if (!virtual) return { start: 0, end: rows.length, offsetY: 0, totalHeight: rows.length * ROW_HEIGHT };
    return visibleRange({
      total: rows.length,
      scrollTop,
      viewportHeight: VIEWPORT_HEIGHT,
      rowHeight: ROW_HEIGHT,
    });
  }, [virtual, rows.length, scrollTop]);

  const shown = rows.slice(range.start, range.end);

  return (
    <section data-testid="data-table" className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400">{rows.length} 行</span>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-400">当前对象类型没有可预览的记录。</p>
      ) : (
        <div
          data-testid="data-table-viewport"
          className="overflow-auto"
          style={{ maxHeight: virtual ? VIEWPORT_HEIGHT : undefined }}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <div style={{ height: range.totalHeight, position: "relative" }}>
            <table
              className="min-w-full border-collapse text-left text-sm"
              style={virtual ? { position: "absolute", top: 0, transform: `translateY(${range.offsetY}px)` } : undefined}
            >
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
                {shown.map((row, idx) => (
                  <tr key={range.start + idx} className="hover:bg-slate-50" style={{ height: ROW_HEIGHT }}>
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
        </div>
      )}
      {virtual && (
        <p data-testid="data-table-virtualized" className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          已启用虚拟滚动：仅渲染可视区间行（第 {range.start + 1}–{range.end} 行 / 共 {rows.length} 行）。
        </p>
      )}
    </section>
  );
}
