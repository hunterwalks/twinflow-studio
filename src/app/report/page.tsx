"use client";

import { useMemo } from "react";
import { useProject } from "@/lib/project/ProjectProvider";
import { makeDataset } from "@/lib/rules/dataset";
import { buildReport } from "@/lib/report/build";
import { toJSON, toHTML } from "@/lib/report/exporters";
import { downloadFile, timestampSlug } from "@/lib/report/download";
import { QualityScoreCard } from "@/components/QualityScoreCard";
import { RuleRecommendations } from "@/components/RuleRecommendations";
import { IssueTable } from "@/components/IssueTable";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { InfoStrip } from "@/components/ui/InfoStrip";

const SOURCE_LABEL: Record<string, string> = {
  empty: "空项目",
  demo: "内置 Demo 数据",
  import: "用户导入数据",
};

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
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <PageHeader eyebrow="TwinFlow Studio · 报告导出" title="数据治理报告导出" />
        <Card className="p-6">
          <EmptyState
            testid="report-empty"
            message="当前没有可导出的数据。请先载入内置 Demo 数据，或在「导入数据」中导入你的表格，再回到此处导出 HTML / JSON 报告。"
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button data-testid="report-load-demo" onClick={() => loadDemo()}>
              载入示例数据
            </Button>
            <ButtonLink href="/import" variant="secondary">
              去导入数据 →
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="TwinFlow Studio · 报告导出"
        title="数据治理报告"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button data-testid="report-download-json" onClick={exportJSON}>
              下载 JSON
            </Button>
            <Button data-testid="report-download-html" variant="secondary" onClick={exportHTML}>
              下载 HTML
            </Button>
          </div>
        }
      />

      <p className="mt-2 text-xs text-ink-3">
        报告生成时间：{report.meta.generatedAt} · 数据来源：{report.meta.source}
      </p>

      {/* 核心指标信息条 + 质量评分 */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <InfoStrip report={report.validation} score={report.quality} />
        </div>
        <div className="lg:col-span-2">
          <QualityScoreCard score={report.quality} />
        </div>
      </div>

      <div className="mt-6">
        <RuleRecommendations recommendations={report.recommendations} />
      </div>

      <div className="mt-6">
        <IssueTable title="问题清单（按级别 → 表 → 行号排序）" issues={report.validation.issues} />
      </div>

      <div className="mt-4">
        <ButtonLink href="/validate" variant="ghost">
          在校验页查看 →
        </ButtonLink>
      </div>
    </div>
  );
}
