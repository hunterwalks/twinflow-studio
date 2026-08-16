"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { GraphNodeData, NodeKind, PositionedEdge, PositionedNode } from "@/lib/graph/types";
import { EmptyState } from "@/components/EmptyState";

const KIND_LABEL: Record<NodeKind, string> = { space: "空间", asset: "资产", sensor: "传感器" };
const KIND_COLOR: Record<NodeKind, string> = {
  space: "border-emerald-400 bg-emerald-50",
  asset: "border-sky-400 bg-sky-50",
  sensor: "border-violet-400 bg-violet-50",
};
const RELATION_LABEL: Record<PositionedEdge["relation"], string> = {
  parent: "父级",
  located: "位于",
  mounted: "挂载",
};

function TwinNode({ data }: NodeProps) {
  const d = data as GraphNodeData;
  return (
    <div
      className={`max-w-[200px] rounded-lg border-2 px-3 py-2 text-xs shadow-sm ${
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

function toRfNode(n: PositionedNode): Node {
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
  };
}

function toRfEdge(e: PositionedEdge): Edge {
  const color =
    e.relation === "parent" ? "#94a3b8" : e.relation === "located" ? "#0ea5e9" : "#a855f7";
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: RELATION_LABEL[e.relation],
    style: { stroke: color, strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: color },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  };
}

export default function GraphPage() {
  const { state, isEmpty, loadDemo, clear } = useProject();
  const [onlyIsolated, setOnlyIsolated] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const model = useMemo(
    () => layoutProject({ spaces: state.spaces, assets: state.assets, sensors: state.sensors }),
    [state],
  );

  const visible = useMemo(() => {
    const nodes = onlyIsolated ? model.nodes.filter((n) => n.isolated) : model.nodes;
    const ids = new Set(nodes.map((n) => n.id));
    const edges = model.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes, edges };
  }, [model, onlyIsolated]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(visible.nodes.map(toRfNode));
    setEdges(visible.edges.map(toRfEdge));
    setSelectedId(null);
  }, [visible, setNodes, setEdges]);

  const isolatedCount = model.nodes.filter((n) => n.isolated).length;
  const selected = model.nodes.find((n) => n.id === selectedId) ?? null;

  if (isEmpty) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
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
            onClick={clear}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
          >
            清空项目
          </button>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← 首页
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div data-testid="graph-canvas" className="h-[640px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
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
              连线：灰=父级、蓝=位于空间、紫=挂载设备。
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
