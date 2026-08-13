"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DemoResult } from "@/lib/loadDemo";
import { useProject } from "@/lib/project/ProjectProvider";
import {
  ASSET_COLUMNS,
  SENSOR_COLUMNS,
  SPACE_COLUMNS,
  assetRows,
  sensorRows,
  spaceRows,
} from "@/lib/table";
import { DataTable } from "./DataTable";
import { ObjectCounts } from "./ObjectCounts";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

type TabKey = "space" | "asset" | "sensor";

const TABS: { key: TabKey; label: string }[] = [
  { key: "space", label: "空间 Space" },
  { key: "asset", label: "资产 Asset" },
  { key: "sensor", label: "传感器 Sensor" },
];

export function DemoView({ result }: { result: DemoResult }) {
  const [tab, setTab] = useState<TabKey>("space");
  const { loadDemo, isEmpty } = useProject();

  useEffect(() => {
    if (result.status === "success" && isEmpty) loadDemo();
  }, [result.status, isEmpty, loadDemo]);

  if (result.status === "error") {
    return <ErrorState message={result.message} />;
  }

  if (result.status === "empty") {
    return <EmptyState />;
  }

  const { data } = result;
  const columns = tab === "space" ? SPACE_COLUMNS : tab === "asset" ? ASSET_COLUMNS : SENSOR_COLUMNS;
  const rows = tab === "space" ? spaceRows(data) : tab === "asset" ? assetRows(data) : sensorRows(data);
  const title = TABS.find((t) => t.key === tab)?.label ?? "数据";

  return (
    <div className="space-y-6">
      <ObjectCounts
        spaces={data.spaces.length}
        assets={data.assets.length}
        sensors={data.sensors.length}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={loadDemo}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          加载此 Demo 到项目
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
