"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DemoResult } from "@/lib/loadDemo";
import {
  DEMO_DATASETS,
  type DemoDataset,
} from "@/lib/data/registry";
import { useProject } from "@/lib/project/ProjectProvider";
import { useToast } from "@/components/Toast";
import {
  ASSET_COLUMNS,
  OBSERVATION_COLUMNS,
  SENSOR_COLUMNS,
  SPACE_COLUMNS,
  type Row,
} from "@/lib/table";
import { DataTable } from "./DataTable";
import { ObjectCounts } from "./ObjectCounts";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

type TabKey = "space" | "asset" | "sensor" | "observation";

const TABS: { key: TabKey; label: string }[] = [
  { key: "space", label: "空间 Space" },
  { key: "asset", label: "资产 Asset" },
  { key: "sensor", label: "传感器 Sensor" },
  { key: "observation", label: "观测 Observation" },
];

export function DemoView({ result }: { result: DemoResult }) {
  const [tab, setTab] = useState<TabKey>("space");
  // 选中的数据集：成功态初始化为 result.data；空/错误态为 null（仅展示状态组件）。
  const [ds, setDs] = useState<DemoDataset | null>(
    result.status === "success" ? result.data : null,
  );
  const { loadDemo, isEmpty, hydrated } = useProject();
  const { notify } = useToast();

  // 仅在水合完成且项目确实为空时，自动加载当前选中数据集，避免挂载瞬间误覆盖已恢复的项目。
  useEffect(() => {
    if (hydrated && ds && isEmpty) loadDemo(ds.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ds, isEmpty, hydrated]);

  if (result.status === "error") {
    return <ErrorState message={result.message} />;
  }

  if (result.status === "empty" || !ds) {
    return <EmptyState />;
  }

  const columns =
    tab === "space"
      ? SPACE_COLUMNS
      : tab === "asset"
        ? ASSET_COLUMNS
        : tab === "sensor"
          ? SENSOR_COLUMNS
          : OBSERVATION_COLUMNS;
  const records =
    tab === "space"
      ? ds.spaces
      : tab === "asset"
        ? ds.assets
        : tab === "sensor"
          ? ds.sensors
          : ds.observations;
  const rows = records as Row[];
  const title = TABS.find((t) => t.key === tab)?.label ?? "数据";

  return (
    <div className="space-y-6">
      <ObjectCounts
        spaces={ds.spaces.length}
        assets={ds.assets.length}
        sensors={ds.sensors.length}
        observations={ds.observations.length}
      />

      {/* 数据集选择：点击同时切换预览并加载到项目 */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="示例数据集">
        {DEMO_DATASETS.map((d) => (
          <button
            key={d.key}
            type="button"
            data-testid={`demo-select-${d.key}`}
            onClick={() => {
              setDs(d);
              loadDemo(d.key);
            }}
            className={
              d.key === ds.key
                ? "rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {d.label}
          </button>
        ))}
      </div>

      {ds.clean ? (
        <p data-testid="demo-clean-badge" className="text-xs text-emerald-600">
          干净基线：预期不产生规则误报
        </p>
      ) : (
        <p data-testid="demo-problem-badge" className="text-xs text-amber-600">
          含典型问题：用于演示规则命中与溯源
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="demo-load"
          onClick={() => {
            loadDemo(ds.key);
            notify("已载入示例数据到当前项目。", "success");
          }}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          重新加载此 Demo 到项目
        </button>
        <Link href="/graph" className="text-sm text-brand-600 hover:underline">
          在关系图中查看 →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="对象类型">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            data-testid={`demo-tab-${t.key}`}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                : "rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable title={`工作表预览 · ${title}`} columns={columns} rows={rows} />
    </div>
  );
}
