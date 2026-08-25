"use client";

import { APP_VERSION } from "@/lib/version";
import { useProject } from "@/lib/project/ProjectProvider";
import { ObjectCounts } from "@/components/ObjectCounts";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  { n: 1, title: "打开 Demo", desc: "一键载入合成数据集，立刻看到 Space / Asset / Sensor / Observation 四类对象。" },
  { n: 2, title: "校验质量", desc: "运行确定性规则，查看分级且可溯源的问题清单与质量评分。" },
  { n: 3, title: "看关系图", desc: "在关系图中查看层级与引用，孤立或悬空对象会被高亮标注原因。" },
  { n: 4, title: "导入你的表", desc: "选择本地 CSV / Excel，映射字段并即时校验，全程不上传。" },
  { n: 5, title: "导出报告", desc: "一键生成自包含 HTML / JSON 治理报告，可离线打开与归档。" },
];

const SOURCE_LABEL: Record<string, string> = {
  demo: "内置 Demo 数据",
  import: "用户导入数据",
  project: "项目文件导入",
  empty: "尚未载入",
};

export default function HomePage() {
  const { state, isEmpty, hydrated } = useProject();

  const total =
    state.spaces.length + state.assets.length + state.sensors.length + state.observations.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow={`TwinFlow Studio · v${APP_VERSION}`}
        title="数字孪生数据建模与质量治理"
      />

      {/* 状态感知：已载入项目 */}
      {hydrated && !isEmpty && (
        <Card data-testid="home-loaded" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-ink-1">当前项目</h2>
            <span
              data-testid="home-source"
              className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-2"
            >
              {SOURCE_LABEL[state.source] ?? "本地数据"} · 共 {total} 条记录
            </span>
          </div>
          <div className="mt-4 rounded-lg bg-surface-2/60 p-4">
            <ObjectCounts
              spaces={state.spaces.length}
              assets={state.assets.length}
              sensors={state.sensors.length}
              observations={state.observations.length}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/validate" data-testid="home-continue-validate">
              继续校验 →
            </ButtonLink>
            <ButtonLink href="/graph" variant="secondary" data-testid="home-continue-graph">
              查看关系图 →
            </ButtonLink>
            <ButtonLink href="/report" variant="secondary" data-testid="home-continue-report">
              导出报告 →
            </ButtonLink>
          </div>
        </Card>
      )}

      {/* 状态感知：空项目（未载入） */}
      {hydrated && isEmpty && (
        <Card data-testid="home-empty" className="border-dashed p-6">
          <h2 className="text-lg font-semibold text-ink-1">开始你的第一次治理</h2>
          <p className="mt-2 text-sm text-ink-2">还没有载入数据。从内置示例开始，或导入你自己的 CSV / Excel。</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="/demo" data-testid="home-open-demo">
              从 Demo 开始 →
            </ButtonLink>
            <ButtonLink href="/import" variant="secondary" data-testid="home-open-import">
              导入数据 →
            </ButtonLink>
          </div>
        </Card>
      )}

      {/* 上手路径：能力地图（两种模式都展示） */}
      <Card data-testid="home-onboarding" className="mt-6 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ink-1">上手路径</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-medium text-ink-1">{s.title}</p>
                <p className="text-sm text-ink-2">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/import" data-testid="home-open-import-2">
            导入数据 →
          </ButtonLink>
          <ButtonLink href="/project" variant="secondary" data-testid="home-open-project">
            打开项目管理 →
          </ButtonLink>
        </div>
      </Card>

    </div>
  );
}
