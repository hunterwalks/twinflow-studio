"use client";

import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { useProject } from "@/lib/project/ProjectProvider";
import { ObjectCounts } from "@/components/ObjectCounts";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const STEPS = [
  { n: 1, title: "打开 Demo", desc: "一键载入合成数据集，立刻看到 Space / Asset / Sensor / Observation 四类对象。" },
  { n: 2, title: "校验质量", desc: "运行 24 条确定性规则，查看分级且可溯源的问题清单与质量评分。" },
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
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Breadcrumbs items={[]} />

      <p className="mt-4 text-sm font-medium text-brand-600">TwinFlow Studio · v{APP_VERSION}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        数字孪生数据建模与质量治理工作台
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Local-first、AI-assisted 的工作台，帮助你在项目早期从表格资产中识别业务对象、
        建立空间与设备关系、检查数据质量并形成可追溯的治理报告。
      </p>

      {/* 状态感知：已载入项目 */}
      {hydrated && !isEmpty && (
        <section
          data-testid="home-loaded"
          className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800">当前项目</h2>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500" data-testid="home-source">
              {SOURCE_LABEL[state.source] ?? "本地数据"} · 共 {total} 条记录
            </span>
          </div>
          <div className="mt-4">
            <ObjectCounts
              spaces={state.spaces.length}
              assets={state.assets.length}
              sensors={state.sensors.length}
              observations={state.observations.length}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/validate"
              data-testid="home-continue-validate"
              className="inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              继续校验 →
            </Link>
            <Link
              href="/graph"
              data-testid="home-continue-graph"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              查看关系图 →
            </Link>
            <Link
              href="/report"
              data-testid="home-continue-report"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              导出报告 →
            </Link>
          </div>
        </section>
      )}

      {/* 状态感知：空项目（未载入） */}
      {hydrated && isEmpty && (
        <section
          data-testid="home-empty"
          className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-800">开始你的第一次治理</h2>
          <p className="mt-2 text-sm text-slate-500">
            还没有载入数据。从内置示例开始，或导入你自己的 CSV / Excel。
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/demo"
              data-testid="home-open-demo"
              className="inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              从 Demo 开始 →
            </Link>
            <Link
              href="/import"
              data-testid="home-open-import"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              导入数据 →
            </Link>
          </div>
        </section>
      )}

      {/* 新手引导：5 步上手（两种模式都展示，作为能力地图） */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" data-testid="home-onboarding">
        <h2 className="text-lg font-semibold text-slate-800">5 步上手</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">{s.title}</p>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/import"
            data-testid="home-open-import-2"
            className="inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            导入数据 →
          </Link>
          <Link
            href="/project"
            data-testid="home-open-project"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            打开项目管理 →
          </Link>
        </div>
      </section>

      {/* 本地优先与隐私说明 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600" data-testid="home-privacy">
        <h2 className="font-semibold text-slate-800">数据在本地处理</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>所有 CSV / Excel 解析、校验与报告生成都在你的浏览器内完成，不会上传到任何业务后端。</li>
          <li>当前项目会自动保存在浏览器本地存储（localStorage），刷新或重开页面后会自动恢复。</li>
          <li>想清空本地数据：进入「关系图」页点击「清空项目」，或在浏览器设置中清除本站数据。</li>
        </ul>
      </section>

      <p className="mt-10 text-xs text-slate-400">
        当前为 v{APP_VERSION}：在 v0.7.0 之上，将项目升级为 Space / Asset / Sensor / Observation 四表模型，
        支持项目 JSON 整体导入 / 导出（兼容 v1 旧项目自动迁移）与导入映射模板复用；
        校验规则增至 24 条，覆盖观测引用完整性、时间戳、数值、同测点重复时间戳，以及观测量纲/单位、质量标记、时间合理性与测点覆盖度。全部为纯函数、可离线、可测试，无外部 AI 依赖。
      </p>
    </main>
  );
}
