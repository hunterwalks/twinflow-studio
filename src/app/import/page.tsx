"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
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
  suggestMappings,
  validateImport,
  type ImportOutcome,
  type Mapping,
  type MappingMethod,
  type MappingSuggestionSet,
} from "@/lib/import/mapping";
import { DataTable } from "@/components/DataTable";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ValidationSummary } from "@/components/ValidationSummary";
import { RuleSummaryTable } from "@/components/RuleSummaryTable";
import { IssueTable } from "@/components/IssueTable";
import { QualityScoreCard } from "@/components/QualityScoreCard";
import { RuleRecommendations } from "@/components/RuleRecommendations";
import { makeDataset } from "@/lib/rules/dataset";
import { runRulesInBatches } from "@/lib/rules/engine";
import { qualityScore, type QualityScore } from "@/lib/quality/score";
import { recommendRules, type RuleRecommendation } from "@/lib/quality/recommend";
import {
  TABLE_LABEL,
  type LooseRecord,
  type RuleDataset,
  type ValidationReport,
} from "@/lib/rules/types";
import { useProject } from "@/lib/project/ProjectProvider";
import {
  applyTemplate,
  deleteTemplate,
  loadTemplates,
  saveTemplate,
  type MappingTemplate,
} from "@/lib/import/templates";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";

const METHOD_LABEL: Record<MappingMethod, string> = {
  exact: "精确",
  normalized: "归一",
  fuzzy: "模糊",
  none: "未匹配",
};

const PREVIEW_LIMIT = 50;

/** 工作表名 → 目标类型的自动识别别名（含中英文）。 */
const SHEET_ALIASES: Record<ImportTargetType, string[]> = {
  space: ["space", "spaces", "空间", "园区", "区域", "楼层", "厂房"],
  asset: ["asset", "assets", "资产", "设备", "装置"],
  sensor: ["sensor", "sensors", "传感器", "测点", "点位"],
  observation: ["observation", "observations", "观测", "读数", "数据", "测值"],
};

function matchSheetTarget(name: string): ImportTargetType | null {
  const norm = name.trim().toLowerCase();
  for (const t of TARGET_TYPES) {
    if (SHEET_ALIASES[t.key].some((a) => norm.includes(a.toLowerCase()))) {
      return t.key;
    }
  }
  return null;
}

function sourceForTarget(mapping: Mapping, targetKey: string): string {
  return Object.keys(mapping).find((src) => mapping[src] === targetKey) ?? "";
}

interface BatchTableResult {
  target: ImportTargetType;
  name: string;
  valid: number;
  errors: number;
}

interface BatchResult {
  totalSheets: number;
  matched: number;
  skipped: { name: string }[];
  perTable: BatchTableResult[];
  report: ValidationReport;
  quality: QualityScore;
  recommendations: RuleRecommendation[];
}

const STEPS = [{ label: "选择文件" }, { label: "映射字段" }, { label: "校验导入" }];

export default function ImportPage() {
  const [fileName, setFileName] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [target, setTarget] = useState<ImportTargetType>("space");
  const [mapping, setMapping] = useState<Mapping>({});
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [quality, setQuality] = useState<QualityScore | null>(null);
  const [recommendations, setRecommendations] = useState<RuleRecommendation[]>([]);
  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [batch, setBatch] = useState<BatchResult | null>(null);
  const applyingTemplate = useRef<MappingTemplate | null>(null);
  const { importTable } = useProject();
  const { notify } = useToast();

  // v0.8.0：从 localStorage 载入已保存的映射模板
  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const PLURAL: Record<ImportTargetType, "spaces" | "assets" | "sensors" | "observations"> = {
    space: "spaces",
    asset: "assets",
    sensor: "sensors",
    observation: "observations",
  };

  const TARGET_LABEL: Record<ImportTargetType, string> = {
    space: "空间",
    asset: "资产",
    sensor: "传感器",
    observation: "观测",
  };
  const targetLabel = (t: ImportTargetType) => TARGET_LABEL[t];

  const currentSheet = useMemo(
    () => (parse && parse.ok ? parse.sheets[selectedSheet] ?? null : null),
    [parse, selectedSheet],
  );

  // v0.5.0：确定性映射建议（置信度打分），用于自动映射与置信度展示
  const suggestions: MappingSuggestionSet = useMemo(
    () => suggestMappings(target, currentSheet?.headers ?? []),
    [currentSheet, target],
  );

  // v0.8.0：映射模板复用。存在待应用模板时优先采用模板映射，否则沿用智能建议。
  useEffect(() => {
    if (currentSheet) {
      if (applyingTemplate.current) {
        setMapping(applyTemplate(applyingTemplate.current, currentSheet.headers));
        applyingTemplate.current = null;
      } else {
        setMapping(suggestions.mapping);
      }
      setOutcome(null);
    } else {
      setMapping({});
    }
    // 仅在表头或目标类型变化时重算默认映射，保留用户编辑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]);

  // v1.2.0：多表批量导入前，按工作表名预计算匹配结果（仅展示，不写状态）
  const sheetMatches = useMemo(() => {
    if (!parse || !parse.ok) return [];
    return parse.sheets.map((s) => ({ name: s.name, target: matchSheetTarget(s.name) }));
  }, [parse]);

  const batchReady = parse?.ok && parse.sheets.length > 1 && sheetMatches.some((m) => m.target);

  // 步骤进度：未解析=0，已解析未确认=1，已确认/批量=2
  const stepCurrent = batch || outcome || validationReport ? 2 : parse?.ok ? 1 : 0;

  function onApplyTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    applyingTemplate.current = tpl;
    setTarget(tpl.target);
  }

  function onSaveTemplate() {
    if (!currentSheet) return;
    const tpl = saveTemplate(templateName, target, mapping);
    setTemplates(loadTemplates());
    setTemplateName("");
    setLastSaved(tpl.name);
  }

  function onDeleteTemplate(id: string) {
    deleteTemplate(id);
    setTemplates(loadTemplates());
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setParse(null);
    setOutcome(null);
    setValidationReport(null);
    setQuality(null);
    setRecommendations([]);
    setBatch(null);
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
    const dataset: RuleDataset = { spaces: [], assets: [], sensors: [], observations: [] };
    dataset[PLURAL[target]] = records as LooseRecord[];
    const fullDataset = makeDataset({ [PLURAL[target]]: dataset[PLURAL[target]] });
    // v1.0.0：分块校验（结果与 runRules 等价），为后续大表异步分批校验留出统一入口。
    const report = runRulesInBatches(fullDataset, undefined, { batchSize: 8 });
    setValidationReport(report);
    setQuality(qualityScore(report));
    setRecommendations(recommendRules(fullDataset));
    importTable(PLURAL[target], outcome.valid);
    notify(`已导入 ${outcome.valid.length} 条${targetLabel(target)}记录，可在「校验」页查看结果。`, "success");
  }

  // v1.2.0：多表批量导入向导。按表名自动匹配四表，顺序导入并给出合并校验摘要。
  function onBatchImport() {
    if (!parse || !parse.ok) return;
    const all: RuleDataset = { spaces: [], assets: [], sensors: [], observations: [] };
    const perTable: BatchTableResult[] = [];
    const skipped: { name: string }[] = [];
    let matched = 0;

    for (const sheet of parse.sheets) {
      const t = matchSheetTarget(sheet.name);
      if (!t) {
        skipped.push({ name: sheet.name });
        continue;
      }
      const autoMapping = suggestMappings(t, sheet.headers).mapping;
      const records = buildRecords(sheet.rows, autoMapping);
      const outcome = validateImport(records, t);
      importTable(PLURAL[t], outcome.valid);
      (all[PLURAL[t]] as LooseRecord[]).push(...(outcome.valid as LooseRecord[]));
      perTable.push({ target: t, name: sheet.name, valid: outcome.valid.length, errors: outcome.errors.length });
      matched += 1;
    }

    const fullDataset = makeDataset(all);
    const report = runRulesInBatches(fullDataset, undefined, { batchSize: 8 });
    setBatch({
      totalSheets: parse.sheets.length,
      matched,
      skipped,
      perTable,
      report,
      quality: qualityScore(report),
      recommendations: recommendRules(fullDataset),
    });
  }

  function onReset() {
    setParse(null);
    setOutcome(null);
    setValidationReport(null);
    setQuality(null);
    setRecommendations([]);
    setBatch(null);
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="TwinFlow Studio · 数据导入"
        title="CSV / XLSX 导入与字段映射"
        lead="选择本地的 CSV 或 Excel 文件，预览工作表并映射到 Space / Asset / Sensor / Observation 模型字段。解析与映射全部在浏览器本地完成，文件不会上传。"
      />

      <Card className="mt-6 p-5">
        <Stepper steps={STEPS} current={stepCurrent} />
      </Card>

      {/* 文件选择 */}
      <Card className="mt-6 p-5">
        <CardHead title="选择文件" />
        <div className="mt-3 flex flex-wrap items-center gap-3 p-1">
          <input
            id="file-input"
            data-testid="import-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="block w-full max-w-sm text-sm text-ink-2 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={busy}
          />
          {fileName && (
            <Button variant="secondary" onClick={onReset}>
              重新选择
            </Button>
          )}
        </div>
        {busy && <p className="mt-3 text-sm text-ink-3">正在解析文件…</p>}
        {fileName && parse?.ok && (
          <p className="mt-3 text-sm text-ink-2">
            已加载 <span className="font-medium text-ink-1">{fileName}</span>
            （{parse.format === "csv" ? "CSV" : "Excel"}，{parse.sheets.length} 个工作表）
          </p>
        )}
      </Card>

      {/* 解析失败 */}
      {parse && !parse.ok && <ErrorState message={parse.error} />}

      {/* 已保存映射模板（始终可见，便于跨会话复用） */}
      <Card className="mt-6 p-5">
        <CardHead title="已保存的映射模板" meta="跨会话复用" />
        <p className="mt-2 px-1 text-xs text-ink-3">
          选择文件后，可在此一键应用已保存的字段映射模板（仅匹配文件实际存在的列）。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) onApplyTemplate(e.target.value);
            }}
            data-testid="import-template-select"
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink-1"
          >
            <option value="">— 应用已有模板 —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}（{TARGET_TYPES.find((x) => x.key === t.target)?.label ?? t.target}）
              </option>
            ))}
          </select>
        </div>
        {templates.length > 0 && (
          <ul className="mt-2 space-y-1 px-1">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-xs text-ink-2">
                <span className="flex-1 truncate">{t.name}</span>
                <button type="button" onClick={() => onApplyTemplate(t.id)} className="text-brand-600 hover:underline">
                  应用
                </button>
                <button type="button" onClick={() => onDeleteTemplate(t.id)} className="text-ink-3 hover:text-err">
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 解析成功后的主流程 */}
      {parse && parse.ok && (
        <div className="mt-6 space-y-6">
          {/* v1.2.0：多表批量导入向导 */}
          {batchReady && (
            <Card className="border-brand-200 bg-brand-50/60 p-5">
              <CardHead title="多表批量导入（自动匹配四表）" />
              <p className="mt-2 px-1 text-xs leading-5 text-ink-2">
                检测到 {parse.sheets.length} 个工作表，已按表名自动识别：
              </p>
              <ul className="mt-2 space-y-1 px-1 text-xs text-ink-2">
                {sheetMatches.map((m) => (
                  <li key={m.name} className="flex items-center gap-2">
                    <span className="flex-1 truncate">{m.name}</span>
                    {m.target ? (
                      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-brand-700">→ {TARGET_TYPES.find((t) => t.key === m.target)?.label}</span>
                    ) : (
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-ink-3">未识别</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-3 px-1">
                <Button data-testid="import-batch" onClick={onBatchImport}>
                  一键自动匹配并导入四表
                </Button>
              </div>
            </Card>
          )}

          {/* 批量导入结果（合并校验摘要） */}
          {batch && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-3">
                  已自动导入 {batch.matched} / {batch.totalSheets} 个工作表
                  {batch.skipped.length > 0
                    ? `；未识别 ${batch.skipped.length} 张（可用下方单表模式手动导入）`
                    : ""}
                  。整库级校验结果如下，可在关系图中查看整体结构。
                </p>
                <Link href="/graph" className="text-sm font-medium text-brand-600 hover:underline">
                  在关系图中查看 →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {batch.perTable.map((t) => (
                  <div key={t.target} className="rounded-lg border border-line bg-surface p-3">
                    <p className="text-xs text-ink-2">{TARGET_TYPES.find((x) => x.key === t.target)?.label}</p>
                    <p className="truncate text-xs text-ink-3">{t.name}</p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold text-ok">{t.valid}</span>
                      <span className="text-ink-3"> 通过 · </span>
                      <span className="font-semibold text-err">{t.errors}</span>
                      <span className="text-ink-3"> 错误</span>
                    </p>
                  </div>
                ))}
              </div>

              {batch.skipped.length > 0 && (
                <p className="text-xs text-ink-3">未识别表：{batch.skipped.map((s) => s.name).join("、")}</p>
              )}

              <Card className="p-5">
                <CardHead title="整库级规则校验" />
                <p className="mt-2 px-1 text-xs leading-5 text-ink-3">
                  四表已全部导入，下列为跨表整体校验结果（含引用 / 覆盖类规则）。
                </p>
              </Card>
              <ValidationSummary report={batch.report} />
              <RuleSummaryTable rows={batch.report.byRule} />
              <IssueTable title="问题清单（按级别 → 表 → 行号排序）" issues={batch.report.issues} />
              <div className="grid gap-4 md:grid-cols-2">
                <QualityScoreCard score={batch.quality} />
                <RuleRecommendations recommendations={batch.recommendations} />
              </div>
            </div>
          )}

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
                      : "rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2"
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

          {/* 字段映射（单表模式，始终保留以兼容高级 / 自定义场景） */}
          {currentSheet && currentSheet.rows.length > 0 && (
            <Card className="p-5">
              <CardHead title="字段映射（单表模式）" />

              <div className="mt-3 flex flex-wrap gap-2 px-1">
                {TARGET_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTarget(t.key)}
                    className={
                      target === t.key
                        ? "rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                        : "rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2"
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <p className="mt-2 px-1 text-xs text-ink-3">
                将下方源列映射到「{TARGET_TYPES.find((t) => t.key === target)?.label}」的字段。
                v0.5.0 起按表头做置信度打分的智能映射（精确 / 归一 / 模糊），高置信自动映射，低置信需复核。
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs text-ink-2">智能映射置信度：</span>
                <span className="rounded bg-ok/10 px-2 py-0.5 text-xs font-medium text-ok">高 {suggestions.high}</span>
                <span className="rounded bg-warn/10 px-2 py-0.5 text-xs font-medium text-warn">中 {suggestions.medium}</span>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-3">低/未匹配 {suggestions.low}</span>
              </div>

              {/* 保存当前映射为模板（需已载入文件） */}
              <div className="mt-4 rounded-lg border border-line bg-surface-2/60 p-4">
                <h3 className="text-sm font-semibold text-ink-1">保存当前映射为模板</h3>
                <p className="mt-1 text-xs text-ink-3">可将当前字段映射保存为模板，下次导入同结构文件时一键复用。</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="模板名称（可选）"
                    data-testid="import-template-name"
                    className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink-1"
                  />
                  <Button data-testid="import-template-save" onClick={onSaveTemplate}>
                    保存当前映射为模板
                  </Button>
                </div>
                {lastSaved && (
                  <p data-testid="import-template-saved" className="mt-2 text-xs text-ok">
                    已保存模板「{lastSaved}」。
                  </p>
                )}
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-surface-2">
                      <th className="border-b border-line px-4 py-2 font-medium text-ink-2">目标字段</th>
                      <th className="border-b border-line px-4 py-2 font-medium text-ink-2">映射到源列</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TARGET_FIELDS[target].map((f) => (
                      <tr key={f.key} className="border-b border-line/70">
                        <td className="px-4 py-2 text-ink-1">
                          {f.label}
                          {f.required && <span className="ml-1 text-err">*</span>}
                          <span className="ml-2 text-xs text-ink-3">{f.key}</span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <select
                              value={sourceForTarget(mapping, f.key)}
                              onChange={(e) => setTargetSource(f.key, e.target.value)}
                              className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink-1"
                            >
                              <option value="">— 不映射 —</option>
                              {currentSheet.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                            {(() => {
                              const sug = suggestions.suggestions.find((s) => s.target === f.key);
                              if (!sug) return null;
                              const selected = sourceForTarget(mapping, f.key);
                              if (sug.source == null) {
                                return <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-3">未匹配</span>;
                              }
                              if (selected !== sug.source) {
                                return <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-3">手动</span>;
                              }
                              const tone =
                                sug.method === "exact"
                                  ? "bg-ok/10 text-ok"
                                  : sug.method === "normalized"
                                    ? "bg-info/10 text-info"
                                    : "bg-warn/10 text-warn";
                              return (
                                <span className={`rounded px-1.5 py-0.5 text-xs ${tone}`}>
                                  {METHOD_LABEL[sug.method]}
                                  {sug.method !== "exact" && sug.score > 0 ? ` ${(sug.score * 100).toFixed(0)}%` : ""}
                                  {sug.needsReview ? " · 需复核" : ""}
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <Button data-testid="import-confirm" onClick={onConfirm}>
                  确认导入并校验
                </Button>
              </div>
            </Card>
          )}

          {/* 单表校验结果 */}
          {outcome && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg border border-ok/30 bg-ok/10 px-4 py-3">
                  <p className="text-xs text-ok">通过</p>
                  <p className="text-xl font-semibold text-ok">{outcome.valid.length}</p>
                </div>
                <div className="rounded-lg border border-err/30 bg-err/10 px-4 py-3">
                  <p className="text-xs text-err">错误</p>
                  <p className="text-xl font-semibold text-err">{outcome.errors.length}</p>
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
                <Card className="border-err/30 p-4">
                  <CardHead title={`逐行错误（${outcome.errors.length}）`} />
                  <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto px-1 font-mono text-xs text-ink-2">
                    {outcome.errors.slice(0, 100).map((err, i) => (
                      <li key={i}>
                        <span className="text-err">第 {err.row} 行</span>：{err.message}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {outcome.valid.length === 0 && outcome.errors.length > 0 && (
                <ErrorState message="没有通过校验的记录，请检查字段映射与必填项后重试。" />
              )}
            </div>
          )}

          {/* 单表规则引擎校验结果 */}
          {validationReport && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-ink-3">本次导入已写入项目，可在关系图中查看整体结构。</p>
                <Link href="/graph" className="text-sm font-medium text-brand-600 hover:underline">
                  在关系图中查看 →
                </Link>
              </div>
              <Card className="p-5">
                <CardHead title="规则引擎校验" />
                <p className="mt-2 px-1 text-xs leading-5 text-ink-3">
                  本次仅导入了「{TABLE_LABEL[target]}」单表，引擎只在该表内执行规则；
                  涉及其他表的引用 / 覆盖类规则因数据不足被自动跳过（见下方「规则维度汇总」中的「已跳过」），
                  不会产生悬空引用误报。如需整库级校验，请使用「校验数据」页面，或使用上方「多表批量导入」。
                </p>
              </Card>
              <ValidationSummary report={validationReport} />
              <RuleSummaryTable rows={validationReport.byRule} />
              <IssueTable
                title="问题清单（按级别 → 表 → 行号排序，已排除跨表跳过项）"
                issues={validationReport.issues}
              />

              {quality && (
                <div className="grid gap-4 md:grid-cols-2">
                  <QualityScoreCard score={quality} />
                  <RuleRecommendations recommendations={recommendations} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
