"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { industrialPark } from "@/lib/data/industrialPark";
import { messyPark, rootlessSpaces } from "@/lib/data/messyPark";
import { cityInfraClean } from "@/lib/data/cityInfraClean";
import { cityInfraProblem } from "@/lib/data/cityInfraProblem";
import { toRuleDataset } from "@/lib/rules/dataset";
import { filterBySeverity, filterByTable, runRules } from "@/lib/rules/engine";
import {
  SEVERITY_LABEL,
  TABLE_LABEL,
  type Issue,
  type RuleDataset,
  type Severity,
  type TableName,
} from "@/lib/rules/types";
import { IssueTable } from "@/components/IssueTable";
import { RuleSummaryTable } from "@/components/RuleSummaryTable";
import { QualityScoreCard } from "@/components/QualityScoreCard";
import { RuleRecommendations } from "@/components/RuleRecommendations";
import { qualityScore } from "@/lib/quality/score";
import { recommendRules } from "@/lib/quality/recommend";
import { applyFix as applyFixToState, proposeFix, type ProposedFix } from "@/lib/fixes";
import type { ProjectState } from "@/lib/project/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead } from "@/components/ui/Card";
import { InfoStrip } from "@/components/ui/InfoStrip";

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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="TwinFlow Studio · 质量校验"
        title="校验规则引擎与问题溯源"
        lead={`内置 ${report.ruleCount} 条确定性校验规则，覆盖完整性、唯一性、引用完整性、层级、覆盖度与规范性 6 个类别。每条问题都定位到具体的表、行号、记录 ID 与字段，并给出修复建议；规则为纯函数，同一份数据必然得到同一结果。`}
      />

      {/* 校验对象：样本选择卡片化 */}
      <Card className="p-5">
        <CardHead title="校验对象" meta={`${recordCount} 条记录`} />
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLES.map((s) => {
            const active = s.key === sampleKey;
            return (
              <button
                key={s.key}
                type="button"
                data-testid={`validate-sample-${s.key}`}
                onClick={() => setSampleKey(s.key)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                    : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
                }`}
              >
                <p className={`text-sm font-medium ${active ? "text-brand-700" : "text-ink-1"}`}>
                  {s.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-2">{s.note}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 核心指标信息条 + 质量评分 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <InfoStrip report={report} score={quality} />
        </div>
        <div className="lg:col-span-2">
          <QualityScoreCard score={quality} />
        </div>
      </div>

      <div className="mt-4">
        <ButtonLinkSafe href="/report" label="导出当前数据为完整报告（HTML / JSON）" />
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
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink-2">级别</span>
          {SEVERITY_FILTERS.map((f) => (
            <FilterPill key={f.key} active={f.key === severity} onClick={() => setSeverity(f.key)}>
              {f.label}
            </FilterPill>
          ))}
          <span className="ml-2 text-sm font-medium text-ink-2">表</span>
          {TABLE_FILTERS.map((f) => (
            <FilterPill key={f.key} active={f.key === table} onClick={() => setTable(f.key)}>
              {f.label}
            </FilterPill>
          ))}
        </div>

        <IssueTable
          title="问题清单（按级别 → 表 → 行号排序）"
          issues={filtered}
          fixResolver={fixFor}
          onApplyFix={onApplyFix}
        />
      </div>

      <p className="mt-8 text-xs text-ink-3">
        分级说明：错误 = 数据不可用，会导致建模失败或引用断裂；警告 = 可用但存在治理风险或规范缺陷；
        提示 = 完整度与覆盖度信息，可按项目要求决定是否处理。
        当被引用表未导入时，跨表规则会被跳过并在规则维度汇总中标注原因，以避免把整表判为悬空引用。
      </p>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "border border-line bg-surface text-ink-2 hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

function ButtonLinkSafe({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
      {label} →
    </Link>
  );
}
