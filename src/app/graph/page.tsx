"use client";

import { useEffect, useMemo, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  MarkerType,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useProject } from "@/lib/project/ProjectProvider";
import { layoutProject } from "@/lib/graph/layout";
import type { GraphNodeData, NodeKind, PositionedEdge, PositionedNode, RelationKind } from "@/lib/graph/types";
import { EmptyState } from "@/components/EmptyState";

const KIND_LABEL: Record<NodeKind, string> = { space: "空间", asset: "资产", sensor: "传感器" };
const KIND_COLOR: Record<NodeKind, string> = {
  space: "border-emerald-400 bg-emerald-50",
  asset: "border-sky-400 bg-sky-50",
  sensor: "border-violet-400 bg-violet-50",
};
const RELATION_LABEL: Record<RelationKind, string> = {
  parent: "父级",
  located: "位于",
  mounted: "挂载",
};
const RELATION_COLOR: Record<RelationKind, string> = {
  parent: "#475569",
  located: "#0284c7",
  mounted: "#9333ea",
};

function TwinNode({ data }: NodeProps) {
  const d = data as GraphNodeData;
  return (
    <div
      className={`max-w-[200px] cursor-pointer rounded-lg border-2 px-3 py-2 text-xs shadow-sm ${
        KIND_COLOR[d.kind]
      } ${d.isolated ? "ring-2 ring-orange-400" : ""}`}
    >
      <div className="truncate font-semibold text-slate-800">{d.label}</div>
      <div className="text-slate-500">
        {KIND_LABEL[d.kind]} · {d.sublabel || "—"}
      </div>
      {d.isolated && (
        <div className="mt-1 text-orange-600">⚠ 孤立：{d.reason}</div>
      )}
    </div>
  );
}

const nodeTypes = { twin: TwinNode };

function toRfNode(n: PositionedNode, hoveredId: string | null, isNeighbor: boolean): Node {
  const active = hoveredId != null && (hoveredId === n.id || isNeighbor);
  const dim = hoveredId != null && !active;
  return {
    id: n.id,
    type: "twin",
    position: { x: n.x, y: n.y },
    data: {
      kind: n.kind,
      recordId: n.recordId,
      label: n.label,
      sublabel: n.sublabel,
      isolated: n.isolated,
      reason: n.reason,
    } satisfies GraphNodeData,
    className: active ? "ring-2 ring-brand-500" : undefined,
    style: dim ? { opacity: 0.35 } : undefined,
  };
}

function toRfEdge(e: PositionedEdge, hoveredId: string | null): Edge {
  const color = RELATION_COLOR[e.relation];
  const connected = hoveredId != null && (e.source === hoveredId || e.target === hoveredId);
  const dim = hoveredId != null && !connected;
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: RELATION_LABEL[e.relation],
    animated: connected,
    style: {
      stroke: color,
      strokeWidth: connected ? 3.5 : 2,
      opacity: dim ? 0.12 : 1,
    },
    labelStyle: { fontSize: 10, fill: color, opacity: dim ? 0.2 : 1 },
    labelBgStyle: { fill: "#ffffff", opacity: dim ? 0.15 : 0.85 },
    labelBgPadding: [4, 2],
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
  };
}

export default function GraphPage() {
  const { state, isEmpty, loadDemo, clear } = useProject();
  const { notify } = useToast();
  const [onlyIsolated, setOnlyIsolated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [relFilter, setRelFilter] = useState<Record<RelationKind, boolean>>({
    parent: true,
    located: true,
    mounted: true,
  });

  const model = useMemo(
    () => layoutProject({ spaces: state.spaces, assets: state.assets, sensors: state.sensors }),
    [state],
  );

  const visible = useMemo(() => {
    const nodes = onlyIsolated ? model.nodes.filter((n) => n.isolated) : model.nodes;
    const ids = new Set(nodes.map((n) => n.id));
    const edges = model.edges.filter(
      (e) => ids.has(e.source) && ids.has(e.target) && relFilter[e.relation],
    );
    return { nodes, edges };
  }, [model, onlyIsolated, relFilter]);

  const neighbors = useMemo(() => {
    const set = new Set<string>();
    if (hoveredId) {
      for (const e of visible.edges) {
        if (e.source === hoveredId) set.add(e.target);
        if (e.target === hoveredId) set.add(e.source);
      }
    }
    return set;
  }, [hoveredId, visible.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // 数据范围变化时重置选中
  useEffect(() => {
    setSelectedId(null);
  }, [visible]);

  // 重建画布节点/连线（含 hover 高亮）
  useEffect(() => {
    setNodes(visible.nodes.map((n) => toRfNode(n, hoveredId, neighbors.has(n.id))));
    setEdges(visible.edges.map((e) => toRfEdge(e, hoveredId)));
  }, [visible, hoveredId, neighbors, setNodes, setEdges]);

  const isolatedCount = model.nodes.filter((n) => n.isolated).length;
  const selected = model.nodes.find((n) => n.id === selectedId) ?? null;

  if (isEmpty) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Breadcrumbs items={[{ href: "/graph", label: "关系图" }]} />
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 关系图</p>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← 返回首页
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">对象关系图</h1>
        <div className="mt-6">
          <EmptyState testid="graph-empty" message="当前没有可可视化的项目数据。" />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              data-testid="graph-load-demo"
              onClick={() => loadDemo()}
              className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              加载内置 Demo
            </button>
            <Link
              href="/import"
              className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              去导入数据
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const relToggle = (r: RelationKind) =>
    setRelFilter((p) => ({ ...p, [r]: !p[r] }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumbs items={[{ href: "/graph", label: "关系图" }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 关系图</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">对象关系图</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span data-testid="graph-stats" className="text-xs text-slate-500">
            节点 {model.nodes.length} · 连线 {model.edges.length} · 孤立 {isolatedCount}
          </span>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyIsolated}
              onChange={(e) => setOnlyIsolated(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            仅看孤立对象
          </label>
          <button
            type="button"
            data-testid="graph-clear"
            onClick={() => {
              clear();
              notify("已清空本地项目数据。", "info");
            }}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            清空项目
          </button>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← 首页
          </Link>
        </div>
      </div>

      {/* 关系类型筛选 */}
      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm">
        <span className="font-medium text-slate-500">关系筛选：</span>
        {(["parent", "located", "mounted"] as RelationKind[]).map((r) => (
          <label key={r} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={relFilter[r]}
              onChange={() => relToggle(r)}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RELATION_COLOR[r] }}
            />
            {RELATION_LABEL[r]}
          </label>
        ))}
        <span className="text-slate-400">（悬停节点可高亮其关联边）</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div data-testid="graph-canvas" className="h-[640px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
            onNodeMouseLeave={() => setHoveredId(null)}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: false }}
          >
            <Background gap={16} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <h2 className="font-semibold text-slate-700">图例</h2>
            <ul className="mt-2 space-y-1 text-slate-600">
              <li><span className="inline-block h-3 w-3 rounded-full bg-emerald-400" /> 空间 Space</li>
              <li><span className="inline-block h-3 w-3 rounded-full bg-sky-400" /> 资产 Asset</li>
              <li><span className="inline-block h-3 w-3 rounded-full bg-violet-400" /> 传感器 Sensor</li>
              <li><span className="inline-block h-3 w-3 rounded-full bg-orange-400 ring-2 ring-orange-400" /> 孤立/悬空（橙色描边）</li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              连线方向：深灰=父级（父空间→子空间）、蓝=位于（空间→资产）、紫=挂载（资产→传感器）。
            </p>
          </div>

          <div className="min-h-[120px] rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <h2 className="font-semibold text-slate-700">对象详情</h2>
            {selected ? (
              <div className="mt-2 space-y-1 text-slate-600">
                <p><span className="text-slate-400">类型</span> {KIND_LABEL[selected.kind]}</p>
                <p><span className="text-slate-400">ID</span> {selected.recordId}</p>
                <p><span className="text-slate-400">名称</span> {selected.label}</p>
                <p><span className="text-slate-400">关键字段</span> {selected.sublabel || "—"}</p>
                {selected.isolated && (
                  <p className="mt-1 rounded bg-orange-50 px-2 py-1 text-orange-600">
                    ⚠ 孤立：{selected.reason}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">点击图中节点查看详情。</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
