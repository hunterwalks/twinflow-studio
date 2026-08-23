"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { useProject } from "@/lib/project/ProjectProvider";
import { serializeProject, parseProjectFile } from "@/lib/project/io";
import { ObjectCounts } from "@/components/ObjectCounts";
import { getDemoDataset } from "@/lib/data/registry";
import type { ProjectMetadata, ProjectSource } from "@/lib/project/types";
import { EMPTY_METADATA } from "@/lib/project/types";
import { searchProject, type SearchHit } from "@/lib/project/search";
import { APP_VERSION } from "@/lib/version";

const SOURCE_LABEL: Record<ProjectSource, string> = {
  empty: "空项目",
  demo: "内置 Demo",
  import: "逐表导入",
  project: "项目文件导入",
};

function downloadProject(state: ReturnType<typeof useProject>["state"]) {
  const json = serializeProject(state);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `twinflow-project-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ProjectPage() {
  const { state, isEmpty, loadDemo, clear, importProject, updateMetadata } = useProject();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // 元信息编辑草稿：state.metadata 变化（保存 / 导入 / 清空）时重新同步
  const [draft, setDraft] = useState<ProjectMetadata>(() => ({
    ...EMPTY_METADATA,
    ...(state.metadata ?? {}),
  }));
  const [metaOk, setMetaOk] = useState(false);
  useEffect(() => {
    setDraft({ ...EMPTY_METADATA, ...(state.metadata ?? {}) });
  }, [state.metadata]);

  function onSaveMetadata() {
    updateMetadata({
      name: draft.name.trim(),
      description: draft.description.trim(),
      owner: draft.owner.trim(),
    });
    setMetaOk(true);
  }

  // 跨表检索
  const [query, setQuery] = useState("");
  const results: SearchHit[] = searchProject(state, query);

  function onExport() {
    setError(null);
    try {
      downloadProject(state);
      setOk("已导出当前项目为 JSON 文件。");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onImportFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setOk(null);
    setWarnings([]);
    try {
      const text = await file.text();
      const { state: next, warnings: ws } = parseProjectFile(text);
      importProject(next);
      setWarnings(ws);
      const total =
        next.spaces.length + next.assets.length + next.sensors.length + next.observations.length;
      setOk(`已导入项目文件（共 ${total} 条记录），已整体替换当前项目。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const total =
    state.spaces.length + state.assets.length + state.sensors.length + state.observations.length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Breadcrumbs items={[{ href: "/project", label: "项目" }]} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 项目管理</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            用完整项目而非单张表工作
          </h1>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回首页
        </Link>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        v0.8.0 起，项目由 Space / Asset / Sensor / Observation 四张表组成，可整体导出为单个 JSON
        文件并在任意设备恢复；v0.9.0 起可补充项目元信息（名称 / 描述 / 负责人）并跨四表检索。
        导入为覆盖式：会用文件内容整体替换当前项目。全部在浏览器本地完成，不上传数据。
      </p>

      {/* 当前项目概览 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">当前项目</h2>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {SOURCE_LABEL[state.source]} · {APP_VERSION}
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
        <p className="mt-3 text-xs text-slate-400">
          最近更新：{state.updatedAt || "尚无更新"} · 合计 {total} 条记录
        </p>
      </section>

      {/* 项目元信息 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">项目信息</h2>
        <p className="mt-2 text-sm text-slate-500">
          为项目补充名称、描述与负责人，随项目 JSON 一起导出与恢复，便于归档与多项目区分。
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-600">
            项目名称
            <input
              data-testid="project-metadata-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="例如：华东智慧工厂数字孪生"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-600">
            负责人
            <input
              data-testid="project-metadata-owner"
              value={draft.owner}
              onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
              placeholder="例如：Hunter"
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-600 sm:col-span-2">
            项目描述
            <textarea
              data-testid="project-metadata-desc"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="项目范围、数据来源、治理目标等"
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            data-testid="project-metadata-save"
            onClick={onSaveMetadata}
            className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            保存项目信息
          </button>
          {metaOk && (
            <span data-testid="project-metadata-saved" className="text-sm text-emerald-600">
              已保存。
            </span>
          )}
        </div>
      </section>

      {/* 跨表检索 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">跨表检索</h2>
        <p className="mt-2 text-sm text-slate-500">
          在 Space / Asset / Sensor / Observation 四张表中按 ID 或名称模糊查找记录，快速定位数据。
        </p>
        <input
          data-testid="project-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入 ID 或名称片段，例如：OB-10 / 温度"
          className="mt-4 w-full max-w-md rounded-md border border-slate-200 px-3 py-2 text-sm"
        />
        {query.trim() !== "" && (
          <div data-testid="project-search-results" className="mt-4">
            {results.length === 0 ? (
              <p className="text-sm text-slate-400">未找到匹配记录。</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-100">
                {results.map((r) => (
                  <li key={`${r.table}-${r.rowIndex}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {r.tableLabel}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{r.recordId || "（无ID）"}</span>
                    <span className="font-medium text-slate-700">{r.name}</span>
                    <span className="text-xs text-slate-400">
                      {r.matchedField === "id" ? "ID 命中" : "名称命中"}：{r.matchedValue} · 第 {r.rowIndex + 1} 行
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* 导出 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">导出项目 JSON</h2>
        <p className="mt-2 text-sm text-slate-500">
          将当前四张表与元信息导出为单个 JSON 文件，便于归档、版本管理或在其他设备恢复。
        </p>
        <button
          type="button"
          data-testid="project-export"
          onClick={onExport}
          className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          导出当前项目
        </button>
      </section>

      {/* 导入 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">导入项目 JSON</h2>
        <p className="mt-2 text-sm text-slate-500">
          选择一个此前导出的项目 JSON 文件（兼容 v1 旧项目，将自动迁移为 v2 四表）。导入会整体替换当前项目。
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            id="project-file-input"
            data-testid="project-import-file"
            type="file"
            accept=".json,application/json"
            className="block w-full max-w-sm text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
            onChange={(e) => onImportFile(e.target.files?.[0])}
            disabled={busy}
          />
        </div>
        {busy && <p className="mt-3 text-sm text-slate-400">正在导入项目…</p>}
        {error && (
          <p data-testid="project-import-error" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {ok && (
          <div data-testid="project-import-result" className="mt-3 space-y-2">
            <p className="text-sm text-emerald-600">{ok}</p>
            {warnings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-xs text-amber-600">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* 快捷操作 */}
      <section className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="project-load-demo"
          onClick={() => loadDemo(getDemoDataset("city-clean").key)}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          载入城市基础设施（干净）示例
        </button>
        <button
          type="button"
          data-testid="project-clear"
          onClick={clear}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          清空项目
        </button>
        <Link href="/graph" className="text-sm text-brand-600 hover:underline">
          在关系图中查看 →
        </Link>
      </section>

      {isEmpty && (
        <p className="mt-4 text-xs text-slate-400">
          当前为空项目。可以载入示例、从 CSV/Excel 逐表导入，或导入此前导出的项目文件。
        </p>
      )}
    </main>
  );
}
