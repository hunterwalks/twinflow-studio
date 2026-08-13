import type { LooseRecord } from "@/lib/rules/types";
import type { GraphDataset, NodeKind } from "./types";

export interface OrphanResult {
  /** 孤立节点的复合 id 集合（`${kind}#${recordId}`）。 */
  isolated: Set<string>;
  /** 复合 id → 孤立原因（中文）。 */
  reasons: Record<string, string>;
}

function idOf(kind: NodeKind, id: string): string {
  return `${kind}#${id}`;
}

function get(rec: LooseRecord, key: string): string {
  const v = rec[key];
  return v == null ? "" : String(v).trim();
}

/**
 * 识别孤立 / 悬空对象。
 * 规则与 v0.3 校验引擎一致：被引用表为空时跳过跨表悬空判定，避免假阳性。
 * 纯函数、确定性：同输入必得同输出。
 */
export function detectOrphans(data: GraphDataset): OrphanResult {
  const isolated = new Set<string>();
  const reasons: Record<string, string> = {};

  const spaceIds = new Set(data.spaces.map((r) => get(r, "id")).filter(Boolean));
  const assetIds = new Set(data.assets.map((r) => get(r, "id")).filter(Boolean));
  const sensorIds = new Set(data.sensors.map((r) => get(r, "id")).filter(Boolean));

  const spacesEmpty = spaceIds.size === 0;
  const assetsEmpty = assetIds.size === 0;

  const flag = (kind: NodeKind, id: string, reason: string) => {
    if (!id) return;
    const cid = idOf(kind, id);
    if (!isolated.has(cid)) {
      isolated.add(cid);
      reasons[cid] = reason;
    }
  };

  // 1) 悬空引用（被引用表非空才判定，否则跳过避免假阳性）
  for (const s of data.spaces) {
    const id = get(s, "id");
    const pid = get(s, "parentId");
    if (pid && !spaceIds.has(pid)) {
      flag("space", id, `父级空间「${pid}」不存在（悬空引用）`);
    }
  }
  if (!spacesEmpty) {
    for (const a of data.assets) {
      const id = get(a, "id");
      const sid = get(a, "spaceId");
      if (sid && !spaceIds.has(sid)) {
        flag("asset", id, `所属空间「${sid}」不存在（悬空引用）`);
      }
    }
  }
  if (!assetsEmpty) {
    for (const sn of data.sensors) {
      const id = get(sn, "id");
      const aid = get(sn, "assetId");
      if (aid && !assetIds.has(aid)) {
        flag("sensor", id, `所属设备「${aid}」不存在（悬空引用）`);
      }
    }
  }

  // 2) 层级不可达：从根空间（parentId 为空）出发，沿 parentId 反向可达性遍历
  if (!spacesEmpty) {
    const children: Record<string, string[]> = {};
    for (const s of data.spaces) {
      const id = get(s, "id");
      const pid = get(s, "parentId");
      if (pid && spaceIds.has(pid)) {
        (children[pid] ||= []).push(id);
      }
    }
    const roots = data.spaces
      .filter((s) => get(s, "parentId") === "")
      .map((s) => get(s, "id"))
      .filter(Boolean);
    const reachable = new Set<string>();
    const queue = [...roots];
    while (queue.length) {
      const cur = queue.shift() as string;
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      for (const c of children[cur] ?? []) queue.push(c);
    }
    for (const s of data.spaces) {
      const id = get(s, "id");
      const pid = get(s, "parentId");
      if (pid !== "" && !reachable.has(id)) {
        flag("space", id, `空间「${id}」无法从根空间到达（层级不可达）`);
      }
    }
  }

  return { isolated, reasons };
}
