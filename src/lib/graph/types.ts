import type { LooseRecord } from "@/lib/rules/types";

export type NodeKind = "space" | "asset" | "sensor";

export type RelationKind = "parent" | "located" | "mounted";

/** 自定义 React Flow 节点的 data 负载。 */
export interface GraphNodeData extends Record<string, unknown> {
  kind: NodeKind;
  recordId: string;
  label: string;
  sublabel: string;
  isolated: boolean;
  reason?: string;
}

/** 确定性布局产物：已定位的节点与连线。 */
export interface PositionedNode {
  /** 复合 id：`${kind}#${recordId}`，跨表唯一。 */
  id: string;
  kind: NodeKind;
  recordId: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  isolated: boolean;
  reason?: string;
}

export interface PositionedEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationKind;
}

export interface GraphModel {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
}

export const TABLE_PLURAL: Record<NodeKind, "spaces" | "assets" | "sensors"> = {
  space: "spaces",
  asset: "assets",
  sensor: "sensors",
};

/** 输入数据集（宽松记录）。 */
export interface GraphDataset {
  spaces: LooseRecord[];
  assets: LooseRecord[];
  sensors: LooseRecord[];
}
