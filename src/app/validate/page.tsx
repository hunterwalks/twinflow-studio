"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { industrialPark } from "@/lib/data/industrialPark";
import { messyPark, rootlessSpaces } from "@/lib/data/messyPark";
import { cityInfraClean } from "@/lib/data/cityInfraClean";
import { cityInfraProblem } from "@/lib/data/cityInfraProblem";
import { toRuleDataset } from "@/lib/rules/dataset";
import { filterBySeverity, filterByTable, runRules } from "@/lib/rules/engine";
import {
  CATEGORY_LABEL,
  SEVERITY_LABEL,
  TABLE_LABEL,
  type Issue,
  type RuleCategory,
  type RuleDataset,
  type Severity,
  type TableName,
} from "@/lib/rules/types";
import { IssueTable } from "@/components/IssueTable";
import { RuleSummaryTable } from "@/components/RuleSummaryTable";
import { ValidationSummary } from "@/components/ValidationSummary";
import { QualityScoreCard } from "@/components/QualityScoreCard";
import { RuleRecommendations } from "@/components/RuleRecommendations";
import { qualityScore } from "@/lib/quality/score";
import { recommendRules } from "@/lib/quality/recommend";
import { applyFix as applyFixToState, proposeFix, type ProposedFix } from "@/lib/fixes";
import type { ProjectState } from "@/lib/project/types";

interface SampleOption {
  key: string;
  label: string;
  note: string;
  dataset: RuleDataset;
}

const SAMPLES: SampleOption[] = [
  {
    key: "demo",
    label: "内置 Demo 数据",
    note: "v0.1.0 合成工业园区数据集，用于确认干净数据不会产生误报。",
    dataset: toRuleDataset(industrialPark),
  },
  {
    key: "city-clean",
    label: "城市基础设施（干净）",
    note: "v0.7.0 新增：结构完整、引用闭合、量纲一致，验证干净数据零误报。",
    dataset: cityInfraClean,
  },
  {
    key: "messy",
    label: "含问题样例",
    note: "合成脏数据，用于演示各类规则的实际命中效果与溯源信息。",
    dataset: messyPark,
  },
  {
    key: "city-problem",
    label: "城市基础设施（含问题）",
    note: "v0.7.0 新增：城市基础设施场景下的典型脏数据，用于验证规则与报告。",
    dataset: cityInfraProblem,
  },
  {
    key: "rootless",
    label: "无根空间样例",
    note: "所有空间都有父级，用于演示整表级问题（缺少根空间）与层级成环。",
    dataset: rootlessSpaces,
  },
];

const SEVERITY_FILTERS: { key: Severity | "all"; label: string }[] = [
  { key: "all", label: "全部级别" },
  { key: "error", label: SEVERITY_LABEL.error },
  { key: "warning", label: SEVERITY_LABEL.warning },
  { key: "info", label: SEVERITY_LABEL.info },
];

const TABLE_FILTERS: { key: TableName | "all"; label: string }[] = [
  { key: "all", label: "全部表" },
  { key: "space", label: TABLE_LABEL.space },
  { key: "asset", label: TABLE_LABEL.asset },
  { key: "sensor", label: TABLE_LABEL.sensor },
  { key: "observation", label: TABLE_LABEL.observation },
];

function pill(active: boolean): string {
  return active
    ? "rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
    : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50";
}

export default function ValidatePage() {
  const [sampleKey, setSampleKey] = useState<string>("messy");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [table, setTable] = useState<TableName | "all">("all");

  const sample = SAMPLES.find((s) => s.key === sampleKey) ?? SAMPLES[0];
  // 工作副本：默认取自样本，应用修复时就地更新后重新校验，不影响内置样本常量。
  const [working, setWorking] = useState<RuleDataset>(() => structuredClone(sample.dataset));
  useEffect(() => {
    setWorking(structuredClone(SAMPLES.find((s) => s.key === sampleKey)?.dataset ?? SAMPLES[0].dataset));
  }, [sampleKey]);

  const report = useMemo(() => runRules(working), [working]);
  const quality = useMemo(() => qualityScore(report), [report]);
  const recommendations = useMemo(() => recommendRules(working), [working]);

  const projectState = useMemo<ProjectState>(
    () => ({
      version: 2,
      source: "import",
      spaces: working.spaces,
      assets: working.assets,
      sensors: working.sensors,
      observations: working.observations,
      updatedAt: "",
    }),
    [working],
  );

  const fixFor = useCallback((issue: Issue) => proposeFix(issue, projectState), [projectState]);
  const onApplyFix = useCallback((fix: ProposedFix) => {
    setWorking((prev) => {
      const next = applyFixToState(
        {
          version: 2,
          source: "import",
          spaces: prev.spaces,
          assets: prev.assets,
          sensors: prev.sensors,
          observations: prev.observations,
          updatedAt: "",
        },
        fix,
      );
      return {
        spaces: next.spaces,
        assets: next.assets,
        sensors: next.sensors,
        observations: next.observations,
      };
    });
  }, []);

  const filtered = useMemo(
    () => filterByTable(filterBySeverity(report.issues, severity), table),
    [report, severity, table],
  );

  const recordCount =
    working.spaces.length +
    working.assets.length +
    working.sensors.length +
    working.observations.length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Breadcrumbs items={[{ href: "/validate", label: "校验" }]} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 质量校验</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            校验规则引擎与问题溯源
          </h1>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回首页
        </Link>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        内置 {report.ruleCount} 条确定性校验规则，覆盖完整性、唯一性、引用完整性、层级、覆盖度与规范性
        6 个类别。每条问题都定位到具体的表、行号、记录 ID 与字段，并给出修复建议。
        规则为纯函数，同一份数据必然得到同一份结果，不含 AI 判断、不联网。
      </p>

      {/* 数据集选择 */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">校验对象</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.key}
              type="button"
              data-testid={`validate-sample-${s.key}`}
              onClick={() => setSampleKey(s.key)}
              className={pill(s.key === sampleKey)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {sample.note} 当前数据集共 {recordCount} 条记录（空间 {working.spaces.length} / 设备{" "}
          {working.assets.length} / 测点 {working.sensors.length} / 观测{" "}
          {working.observations.length}）。
        </p>
      </div>

      {/* 汇总 + 质量评分 */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ValidationSummary report={report} />
        <QualityScoreCard score={quality} />
      </div>
      <div className="mt-3">
        <Link href="/report" className="text-sm text-brand-600 hover:text-brand-700">
          导出当前数据为完整报告（HTML / JSON）→
        </Link>
      </div>

      {/* 类别分布 */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">类别分布</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {(Object.keys(CATEGORY_LABEL) as RuleCategory[]).map((c) => (
            <span key={c}>
              {CATEGORY_LABEL[c]}
              <span className="ml-2 font-medium text-slate-800">{report.byCategory[c]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 规则维度汇总 */}
      <div className="mt-6">
        <RuleSummaryTable rows={report.byRule} />
      </div>

      {/* 规则与治理建议 */}
      <div className="mt-6">
        <RuleRecommendations recommendations={recommendations} />
      </div>

      {/* 问题清单与筛选 */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          {SEVERITY_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSeverity(f.key)}
              className={pill(f.key === severity)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TABLE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTable(f.key)}
              className={pill(f.key === table)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <IssueTable
          title="问题清单（按级别 → 表 → 行号排序）"
          issues={filtered}
          fixResolver={fixFor}
          onApplyFix={onApplyFix}
        />
      </div>

      <p className="mt-8 text-xs text-slate-400">
        分级说明：错误 = 数据不可用，会导致建模失败或引用断裂；警告 = 可用但存在治理风险或规范缺陷；
        提示 = 完整度与覆盖度信息，可按项目要求决定是否处理。
        当被引用表未导入时，跨表规则会被跳过并在规则维度汇总中标注原因，以避免把整表判为悬空引用。
      </p>
    </main>
  );
}
