import type { LooseRecord } from "@/lib/rules/types";
import type { GraphDataset, GraphModel, NodeKind, PositionedEdge, PositionedNode } from "./types";
import { detectOrphans } from "./orphans";

const ROW_H = 78;
const PAD_LEFT = 40;
const PAD_TOP = 40;
const SPACE_STEP = 220; // 空间每加深一级，横向右移的距离
const ASSET_GAP = 360; // 资产列相对「最右侧空间列」的横向间距
const SENSOR_GAP = 320; // 传感器列相对资产列的横向间距

function get(rec: LooseRecord, key: string): string {
  const v = rec[key];
  return v == null ? "" : String(v).trim();
}

/** 表内稳定排序键：先按归属字段分组（parentId/spaceId/assetId），再按 id，保证同输入同顺序。 */
function sortKey(rec: LooseRecord, groupKey: string): string {
  return `${get(rec, groupKey)} ${get(rec, "id")}`;
}

/**
 * 基于 parentId 链做 BFS，计算每个 Space 的深度（根空间 = 0）。
 * 处理环与悬空父引用：未被 BFS 覆盖的节点兜底为深度 0。
 */
function computeSpaceDepths(spaces: LooseRecord[]): Map<string, number> {
  const ids = new Set(spaces.map((r) => get(r, "id")).filter(Boolean));
  const childrenOf = new Map<string, string[]>();
  const hasParent = new Map<string, boolean>();
  for (const s of spaces) {
    const id = get(s, "id");
    if (!id) continue;
    const pid = get(s, "parentId");
    if (pid && ids.has(pid)) {
      hasParent.set(id, true);
      const arr = childrenOf.get(pid) ?? [];
      arr.push(id);
      childrenOf.set(pid, arr);
    }
  }

  const depth = new Map<string, number>();
  const queue: string[] = [];
  for (const s of spaces) {
    const id = get(s, "id");
    if (id && !hasParent.get(id)) {
      depth.set(id, 0);
      queue.push(id);
    }
  }
  while (queue.length) {
    const cur = queue.shift()!;
    const d = depth.get(cur) ?? 0;
    for (const child of childrenOf.get(cur) ?? []) {
      if (!depth.has(child)) {
        depth.set(child, d + 1);
        queue.push(child);
      }
    }
  }
  // 兜底：环或异常节点
  for (const s of spaces) {
    const id = get(s, "id");
    if (id && !depth.has(id)) depth.set(id, 0);
  }
  return depth;
}

/**
 * 确定性布局：
 * - Space 按 parentId 链计算深度，深度越大越靠右，从而呈现「园区 → 厂房 → 楼层 → 区域」的层级展开；
 * - Asset / Sensor 列排布在最右侧空间之后；
 * - 连线方向统一为「父/容器 → 子/成员」：父级(space#父→space#子)、位于(space#空间→asset#资产)、挂载(asset#资产→sensor#传感器)；
 * - 坐标确定、同列内无重叠；目标缺失时跳过连线（孤立原因由 detectOrphans 标注）。
 */
export function layoutProject(data: GraphDataset): GraphModel {
  const orphans = detectOrphans(data);
  const nodes: PositionedNode[] = [];
  const edges: PositionedEdge[] = [];

  const spaceDepth = computeSpaceDepths(data.spaces);
  let maxDepth = 0;
  for (const d of spaceDepth.values()) maxDepth = Math.max(maxDepth, d);

  const spaceX = (depth: number) => PAD_LEFT + depth * SPACE_STEP;
  const assetX = spaceX(maxDepth) + ASSET_GAP;
  const sensorX = assetX + SENSOR_GAP;

  const colX: Record<NodeKind, (depth: number) => number> = {
    space: spaceX,
    asset: () => assetX,
    sensor: () => sensorX,
  };

  const build = (
    kind: NodeKind,
    records: LooseRecord[],
    labelKey: string,
    subKey: string,
    groupKey: string,
  ) => {
    const sorted = [...records].sort((a, b) =>
      sortKey(a, groupKey).localeCompare(sortKey(b, groupKey)),
    );
    sorted.forEach((rec, i) => {
      const id = get(rec, "id");
      const cid = `${kind}#${id}`;
      nodes.push({
        id: cid,
        kind,
        recordId: id,
        label: get(rec, labelKey) || id,
        sublabel: get(rec, subKey),
        x: colX[kind](kind === "space" ? spaceDepth.get(id) ?? 0 : 0),
        y: PAD_TOP + i * ROW_H,
        isolated: orphans.isolated.has(cid),
        reason: orphans.reasons[cid],
      });
    });
  };

  build("space", data.spaces, "name", "type", "parentId");
  build("asset", data.assets, "name", "type", "spaceId");
  build("sensor", data.sensors, "name", "quantity", "assetId");

  const spaceIds = new Set(data.spaces.map((r) => get(r, "id")).filter(Boolean));
  const assetIds = new Set(data.assets.map((r) => get(r, "id")).filter(Boolean));

  // 父级关系：父空间 → 子空间
  for (const s of data.spaces) {
    const id = get(s, "id");
    const pid = get(s, "parentId");
    if (pid && spaceIds.has(pid)) {
      edges.push({
        id: `e-${pid}-${id}`,
        source: `space#${pid}`,
        target: `space#${id}`,
        relation: "parent",
      });
    }
  }
  // 位于关系：空间 → 资产
  for (const a of data.assets) {
    const id = get(a, "id");
    const sid = get(a, "spaceId");
    if (sid && spaceIds.has(sid)) {
      edges.push({
        id: `e-${sid}-${id}`,
        source: `space#${sid}`,
        target: `asset#${id}`,
        relation: "located",
      });
    }
  }
  // 挂载关系：资产 → 传感器
  for (const sn of data.sensors) {
    const id = get(sn, "id");
    const aid = get(sn, "assetId");
    if (aid && assetIds.has(aid)) {
      edges.push({
        id: `e-${aid}-${id}`,
        source: `asset#${aid}`,
        target: `sensor#${id}`,
        relation: "mounted",
      });
    }
  }

  return { nodes, edges };
}
