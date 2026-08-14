"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProject } from "@/lib/project/ProjectProvider";
import { makeDataset } from "@/lib/rules/dataset";
import { buildReport } from "@/lib/report/build";
import { toJSON, toHTML } from "@/lib/report/exporters";
import { downloadFile, timestampSlug } from "@/lib/report/download";
import { ValidationSummary } from "@/components/ValidationSummary";
import { QualityScoreCard } from "@/components/QualityScoreCard";
import { RuleRecommendations } from "@/components/RuleRecommendations";
import { IssueTable } from "@/components/IssueTable";
import { EmptyState } from "@/components/EmptyState";

const SOURCE_LABEL: Record<string, string> = {
  empty: "空项目",
  demo: "内置 Demo 数据",
  import: "用户导入数据",
};

function btn(primary: boolean): string {
  return primary
    ? "inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
    : "inline-flex items-center rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50";
}

export default function ReportPage() {
  const { state, isEmpty, loadDemo } = useProject();

  const dataset = useMemo(
    () => makeDataset({ spaces: state.spaces, assets: state.assets, sensors: state.sensors }),
    [state.spaces, state.assets, state.sensors],
  );
  const report = useMemo(
    () => buildReport({ dataset, source: SOURCE_LABEL[state.source] ?? state.source }),
    [dataset, state.source],
  );

  function exportJSON() {
    downloadFile(`twinflow-report-${timestampSlug()}.json`, toJSON(report), "application/json");
  }
  function exportHTML() {
    downloadFile(`twinflow-report-${timestampSlug()}.html`, toHTML(report), "text/html; charset=utf-8");
  }

  if (isEmpty) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 报告导出</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">数据治理报告导出</h1>
        <div className="mt-8">
          <EmptyState message="当前没有可导出的数据。请先载入内置 Demo 数据，或在「导入数据」中导入你的表格，再回到此处导出 HTML / JSON 报告。" />
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" className={btn(true)} onClick={loadDemo}>
            载入示例数据
          </button>
          <Link href="/import" className={btn(false)}>
            去导入数据 →
          </Link>
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-slate-500 hover:text-slate-700">
          ← 返回首页
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 报告导出</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">数据治理报告</h1>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回首页
        </Link>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        基于当前项目数据集（{report.meta.recordCount.total} 条记录）聚合的确定性治理报告：含校验问题清单、质量评分与规则建议。
        可一键导出为自包含 HTML（可打印 / 离线打开）或结构化 JSON（便于归档与二次处理）。全部在浏览器本地生成，不上传数据。
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className={btn(true)} onClick={exportJSON}>
          下载 JSON
        </button>
        <button type="button" className={btn(false)} onClick={exportHTML}>
          下载 HTML
        </button>
        <Link href="/validate" className="ml-auto text-sm text-slate-500 hover:text-slate-700">
          在校验页查看 →
        </Link>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        报告生成时间：{report.meta.generatedAt} · 数据来源：{report.meta.source}
      </p>

      {/* 预览 */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ValidationSummary report={report.validation} />
        <QualityScoreCard score={report.quality} />
      </div>

      <div className="mt-6">
        <RuleRecommendations recommendations={report.recommendations} />
      </div>

      <div className="mt-6">
        <IssueTable title="问题清单（按级别 → 表 → 行号排序）" issues={report.validation.issues} />
      </div>
    </main>
  );
}
