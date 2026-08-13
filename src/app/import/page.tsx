"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Column } from "@/lib/table";
import {
  detectFormat,
  parseFile,
  type ParseResult,
} from "@/lib/import/parse";
import {
  TARGET_FIELDS,
  TARGET_TYPES,
  type ImportTargetType,
} from "@/lib/import/fieldTargets";
import {
  buildRecords,
  suggestMapping,
  validateImport,
  type ImportOutcome,
  type Mapping,
} from "@/lib/import/mapping";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ValidationSummary } from "@/components/ValidationSummary";
import { RuleSummaryTable } from "@/components/RuleSummaryTable";
import { IssueTable } from "@/components/IssueTable";
import { makeDataset } from "@/lib/rules/dataset";
import { runRules } from "@/lib/rules/engine";
import {
  TABLE_LABEL,
  type LooseRecord,
  type RuleDataset,
  type ValidationReport,
} from "@/lib/rules/types";
import { useProject } from "@/lib/project/ProjectProvider";

const PREVIEW_LIMIT = 50;

function sourceForTarget(mapping: Mapping, targetKey: string): string {
  return Object.keys(mapping).find((src) => mapping[src] === targetKey) ?? "";
}

export default function ImportPage() {
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [target, setTarget] = useState<ImportTargetType>("space");
  const [mapping, setMapping] = useState<Mapping>({});
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const { importTable } = useProject();

const PLURAL: Record<ImportTargetType, "spaces" | "assets" | "sensors"> = {
  space: "spaces",
  asset: "assets",
  sensor: "sensors",
};

  const currentSheet = useMemo(
    () => (parse && parse.ok ? parse.sheets[selectedSheet] ?? null : null),
    [parse, selectedSheet],
  );

  useEffect(() => {
    if (currentSheet) {
      setMapping(suggestMapping(currentSheet.headers, target));
      setOutcome(null);
    } else {
      setMapping({});
    }
    // 仅在表头或目标类型变化时重算默认映射，保留用户编辑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSheet, target]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setParse(null);
    setOutcome(null);
    setSelectedSheet(0);
    setFileName(file.name);

    const fmt = detectFormat(file.name);
    if (fmt === "unknown") {
      setParse({
        ok: false,
        error: `不支持的文件格式：${file.name}。仅支持 .csv 与 .xlsx / .xls。`,
      });
      setBusy(false);
      return;
    }
    try {
      const content = fmt === "csv" ? await file.text() : await file.arrayBuffer();
      setParse(parseFile(file.name, content));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setParse({ ok: false, error: `读取文件失败：${msg}` });
    } finally {
      setBusy(false);
    }
  }

  function setTargetSource(fieldKey: string, src: string) {
    setMapping((prev) => {
      const next: Mapping = {};
      for (const [s, t] of Object.entries(prev)) {
        if (src && s === src) continue; // 移除该源旧映射
        if (t === fieldKey) continue; // 移除该目标旧映射
        next[s] = t;
      }
      if (src) next[src] = fieldKey;
      for (const h of currentSheet?.headers ?? []) if (!(h in next)) next[h] = null;
      return next;
    });
  }

  function onConfirm() {
    if (!currentSheet) return;
    const records = buildRecords(currentSheet.rows, mapping);
    const outcome = validateImport(records, target);
    setOutcome(outcome);
    // 仅导入了单张表，引擎只在该表内执行规则；涉及其他表的引用 / 覆盖类规则
    // 因数据不足会自动跳过，不会产生悬空引用误报。
    const dataset: RuleDataset = { spaces: [], assets: [], sensors: [] };
    dataset[PLURAL[target]] = records as LooseRecord[];
    setValidationReport(runRules(makeDataset({ [PLURAL[target]]: dataset[PLURAL[target]] })));
    importTable(PLURAL[target], outcome.valid);
  }

  function onReset() {
    setParse(null);
    setOutcome(null);
    setValidationReport(null);
    setFileName("");
    setSelectedSheet(0);
    setMapping({});
  }

  const previewColumns: Column[] = (currentSheet?.headers ?? []).map((h) => ({
    key: h,
    header: h,
  }));
  const previewRows = (currentSheet?.rows ?? []).slice(0, PREVIEW_LIMIT);

  const activeTargets = Array.from(
    new Set(Object.values(mapping).filter((t): t is string => t != null)),
  );
  const resultColumns: Column[] = activeTargets.map((k) => ({
    key: k,
    header: TARGET_FIELDS[target].find((f) => f.key === k)?.label ?? k,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 数据导入</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            CSV / XLSX 导入与字段映射
          </h1>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回首页
        </Link>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        选择本地的 CSV 或 Excel 文件，预览工作表并映射到 Space / Asset / Sensor 模型字段。
        解析与映射全部在浏览器本地完成，文件不会上传。
      </p>

      {/* 文件选择 */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">选择文件</label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="block w-full max-w-sm text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={busy}
          />
          {fileName && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
            >
              重新选择
            </button>
          )}
        </div>
        {busy && <p className="mt-3 text-sm text-slate-400">正在解析文件…</p>}
        {fileName && parse?.ok && (
          <p className="mt-3 text-sm text-slate-500">
            已加载 <span className="font-medium text-slate-700">{fileName}</span>
            （{parse.format === "csv" ? "CSV" : "Excel"}，{parse.sheets.length} 个工作表）
          </p>
        )}
      </div>

      {/* 解析失败 */}
      {parse && !parse.ok && <ErrorState message={parse.error} />}

      {/* 解析成功后的主流程 */}
      {parse && parse.ok && (
        <div className="mt-6 space-y-6">
          {/* 工作表选择 */}
          {parse.sheets.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="工作表">
              {parse.sheets.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  role="tab"
                  aria-selected={i === selectedSheet}
                  onClick={() => setSelectedSheet(i)}
                  className={
                    i === selectedSheet
                      ? "rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* 原始预览 */}
          {currentSheet && currentSheet.rows.length === 0 ? (
            <EmptyState message="当前工作表没有可预览的数据行。" />
          ) : (
            currentSheet && (
              <DataTable
                title={`原始预览 · ${currentSheet.name}（前 ${Math.min(previewRows.length, PREVIEW_LIMIT)} 行）`}
                columns={previewColumns}
                rows={previewRows}
              />
            )
          )}

          {/* 字段映射 */}
          {currentSheet && currentSheet.rows.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">字段映射</h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {TARGET_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTarget(t.key)}
                    className={
                      target === t.key
                        ? "rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                        : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                将下方源列映射到「{TARGET_TYPES.find((t) => t.key === target)?.label}」的字段。
                已按表头给出智能默认映射，可手动调整。
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                        目标字段
                      </th>
                      <th className="border-b border-slate-200 px-4 py-2 font-medium text-slate-500">
                        映射到源列
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TARGET_FIELDS[target].map((f) => (
                      <tr key={f.key} className="border-b border-slate-100">
                        <td className="px-4 py-2 text-slate-700">
                          {f.label}
                          {f.required && <span className="ml-1 text-red-500">*</span>}
                          <span className="ml-2 text-xs text-slate-400">{f.key}</span>
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={sourceForTarget(mapping, f.key)}
                            onChange={(e) => setTargetSource(f.key, e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                          >
                            <option value="">— 不映射 —</option>
                            {currentSheet.headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={onConfirm}
                className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                确认导入并校验
              </button>
            </div>
          )}

          {/* 校验结果 */}
          {outcome && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-600">通过</p>
                  <p className="text-xl font-semibold text-emerald-700">{outcome.valid.length}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-xs text-red-600">错误</p>
                  <p className="text-xl font-semibold text-red-700">{outcome.errors.length}</p>
                </div>
              </div>

              {outcome.valid.length > 0 && (
                <DataTable
                  title={`导入结果 · ${TARGET_TYPES.find((t) => t.key === target)?.label}（${outcome.valid.length} 条）`}
                  columns={resultColumns}
                  rows={outcome.valid}
                />
              )}

              {outcome.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-red-700">逐行错误（{outcome.errors.length}）</h3>
                  <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm text-slate-600">
                    {outcome.errors.slice(0, 100).map((err, i) => (
                      <li key={i} className="font-mono text-xs">
                        <span className="text-red-600">第 {err.row} 行</span>：{err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {outcome.valid.length === 0 && outcome.errors.length > 0 && (
                <ErrorState message="没有通过校验的记录，请检查字段映射与必填项后重试。" />
              )}
            </div>
          )}

          {/* 规则引擎校验结果 */}
          {validationReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">本次导入已写入项目，可在关系图中查看整体结构。</p>
                <Link href="/graph" className="text-sm text-brand-600 hover:underline">
                  在关系图中查看 →
                </Link>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">规则引擎校验</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  本次仅导入了「{TABLE_LABEL[target]}」单表，引擎只在该表内执行规则；
                  涉及其他表的引用 / 覆盖类规则因数据不足被自动跳过（见下方「规则维度汇总」中的「已跳过」），
                  不会产生悬空引用误报。如需整库级校验，请使用「校验数据」页面。
                </p>
              </div>
              <ValidationSummary report={validationReport} />
              <RuleSummaryTable rows={validationReport.byRule} />
              <IssueTable
                title="问题清单（按级别 → 表 → 行号排序，已排除跨表跳过项）"
                issues={validationReport.issues}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
