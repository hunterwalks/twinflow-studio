"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/lib/project/ProjectProvider";
import { serializeProject, parseProjectFile } from "@/lib/project/io";
import { ObjectCounts } from "@/components/ObjectCounts";
import { getDemoDataset } from "@/lib/data/registry";
import type { ProjectMetadata, ProjectSource } from "@/lib/project/types";
import { EMPTY_METADATA } from "@/lib/project/types";
import { searchProject, type SearchHit } from "@/lib/project/search";
import { APP_VERSION } from "@/lib/version";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="用完整项目而非单张表工作" />

      <Card>
        <CardHead title="当前项目" meta={`${SOURCE_LABEL[state.source]} · ${APP_VERSION}`} />
        <div className="p-4">
          <ObjectCounts
            spaces={state.spaces.length}
            assets={state.assets.length}
            sensors={state.sensors.length}
            observations={state.observations.length}
          />
        </div>
      </Card>

      <Card className="mt-6">
        <CardHead title="项目信息" />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <label className="block text-sm text-ink-2">
            项目名称
            <input
              data-testid="project-metadata-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="例如：华东智慧工厂数字孪生"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-1"
            />
          </label>
          <label className="block text-sm text-ink-2">
            负责人
            <input
              data-testid="project-metadata-owner"
              value={draft.owner}
              onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
              placeholder="例如：Hunter"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-1"
            />
          </label>
          <label className="block text-sm text-ink-2 sm:col-span-2">
            项目描述
            <textarea
              data-testid="project-metadata-desc"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="项目范围、数据来源、治理目标等"
              rows={2}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-1"
            />
          </label>
        </div>
        <div className="flex items-center gap-3 px-4 pb-4">
          <Button data-testid="project-metadata-save" onClick={onSaveMetadata}>
            保存项目信息
          </Button>
          {metaOk && (
            <span data-testid="project-metadata-saved" className="text-sm text-ok">
              已保存。
            </span>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHead title="跨表检索" />
        <div className="p-4">
          <input
            data-testid="project-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入 ID 或名称片段，例如：OB-10 / 温度"
            className="w-full max-w-md rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-1"
          />
          {query.trim() !== "" && (
            <div data-testid="project-search-results" className="mt-4">
              {results.length === 0 ? (
                <p className="text-sm text-ink-3">未找到匹配记录。</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {results.map((r) => (
                    <li key={`${r.table}-${r.rowIndex}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                      <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-3">{r.tableLabel}</span>
                      <span className="font-mono text-xs text-ink-4">{r.recordId || "（无ID）"}</span>
                      <span className="font-medium text-ink-1">{r.name}</span>
                      <span className="text-xs text-ink-3">
                        {r.matchedField === "id" ? "ID 命中" : "名称命中"}：{r.matchedValue} · 第 {r.rowIndex + 1} 行
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHead title="导出项目 JSON" />
        <div className="p-4">
          <Button data-testid="project-export" onClick={onExport}>
            导出当前项目
          </Button>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHead title="导入项目 JSON" />
        <div className="p-4">
          <input
            data-testid="project-import-file"
            type="file"
            accept=".json,application/json"
            className="block w-full max-w-sm text-sm text-ink-2 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
            onChange={(e) => onImportFile(e.target.files?.[0])}
            disabled={busy}
          />
          {busy && <p className="mt-3 text-sm text-ink-3">正在导入项目…</p>}
          {error && (
            <p data-testid="project-import-error" className="mt-3 text-sm text-err">
              {error}
            </p>
          )}
          {ok && (
            <div data-testid="project-import-result" className="mt-3 space-y-2">
              <p className="text-sm text-ok">{ok}</p>
              {warnings.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-xs text-warn">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="secondary" data-testid="project-load-demo" onClick={() => loadDemo(getDemoDataset("city-clean").key)}>
          载入城市基础设施（干净）示例
        </Button>
        <Button variant="secondary" data-testid="project-clear" onClick={clear}>
          清空项目
        </Button>
        <ButtonLink href="/graph" variant="ghost">
          在关系图中查看 →
        </ButtonLink>
      </div>

      {isEmpty && (
        <p className="mt-4 text-xs text-ink-3">
          当前为空项目。可以载入示例、从 CSV/Excel 逐表导入，或导入此前导出的项目文件。
        </p>
      )}
    </div>
  );
}
