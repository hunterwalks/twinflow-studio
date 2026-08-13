import type { LooseRecord } from "@/lib/rules/types";
import type { GraphDataset, GraphModel, NodeKind, PositionedEdge, PositionedNode } from "./types";
import { detectOrphans } from "./orphans";

const COL_X: Record<NodeKind, number> = { space: 0, asset: 1, sensor: 2 };
const COL_W = 320;
const ROW_H = 78;
const PAD_LEFT = 40;
const PAD_TOP = 40;

function get(rec: LooseRecord, key: string): string {
  const v = rec[key];
  return v == null ? "" : String(v).trim();
}

/** 表内稳定排序键：先按归属字段分组（parentId/spaceId/assetId），再按 id，保证同输入同顺序。 */
function sortKey(rec: LooseRecord, groupKey: string): string {
  return `${get(rec, groupKey)} ${get(rec, "id")}`;
}

/**
 * 确定性布局：按 Space/Asset/Sensor 分三列，表内按归属字段 + id 稳定排序。
 * 坐标确定、同列内无重叠；边连接三类关系（parent / located / mounted）。
 * 目标缺失时跳过连线（孤立原因由 detectOrphans 标注）。
 */
export function layoutProject(data: GraphDataset): GraphModel {
  const orphans = detectOrphans(data);
  const nodes: PositionedNode[] = [];
  const edges: PositionedEdge[] = [];

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
        x: PAD_LEFT + COL_X[kind] * COL_W,
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

  for (const s of data.spaces) {
    const id = get(s, "id");
    const pid = get(s, "parentId");
    if (pid && spaceIds.has(pid)) {
      edges.push({
        id: `e-${id}-${pid}`,
        source: `space#${id}`,
        target: `space#${pid}`,
        relation: "parent",
      });
    }
  }
  for (const a of data.assets) {
    const id = get(a, "id");
    const sid = get(a, "spaceId");
    if (sid && spaceIds.has(sid)) {
      edges.push({
        id: `e-${id}-${sid}`,
        source: `asset#${id}`,
        target: `space#${sid}`,
        relation: "located",
      });
    }
  }
  for (const sn of data.sensors) {
    const id = get(sn, "id");
    const aid = get(sn, "assetId");
    if (aid && assetIds.has(aid)) {
      edges.push({
        id: `e-${id}-${aid}`,
        source: `sensor#${id}`,
        target: `asset#${aid}`,
        relation: "mounted",
      });
    }
  }

  return { nodes, edges };
}
