import { describe, expect, it } from "vitest";
import type { LooseRecord } from "@/lib/rules/types";
import { layoutProject } from "@/lib/graph/layout";
import type { GraphDataset } from "@/lib/graph/types";

const spaces: LooseRecord[] = [
  { id: "SP-ROOT", name: "园区", type: "park", parentId: "", description: "" },
  { id: "SP-B", name: "楼B", type: "building", parentId: "SP-ROOT", description: "" },
];
const assets: LooseRecord[] = [
  { id: "AS-1", name: "泵1", type: "pump", spaceId: "SP-B", description: "" },
];
const sensors: LooseRecord[] = [
  { id: "SE-1", name: "温度", assetId: "AS-1", quantity: "温度", unit: "℃", description: "" },
];

const data: GraphDataset = { spaces, assets, sensors };

describe("图布局 layoutProject", () => {
  it("同一输入产生确定一致的坐标（可复现）", () => {
    const a = layoutProject(data);
    const b = layoutProject(data);
    expect(a.nodes).toEqual(b.nodes);
    expect(a.edges).toEqual(b.edges);
  });

  it("同列内节点无坐标重叠", () => {
    const { nodes } = layoutProject(data);
    const keys = nodes.map((n) => `${n.x},${n.y}`);
    expect(new Set(keys).size).toBe(nodes.length);
  });

  it("按 Space/Asset/Sensor 分列（space.x < asset.x < sensor.x）", () => {
    const { nodes } = layoutProject(data);
    const byKind = (k: string) => nodes.find((n) => n.kind === k)!.x;
    expect(byKind("space")).toBeLessThan(byKind("asset"));
    expect(byKind("asset")).toBeLessThan(byKind("sensor"));
  });

  it("为三类关系生成正确数量的连线", () => {
    const { edges } = layoutProject(data);
    expect(edges).toHaveLength(3);
    expect(edges.map((e) => e.relation).sort()).toEqual(
      ["located", "mounted", "parent"].sort(),
    );
  });

  it("目标缺失时不生成悬空连线（孤立由 orphans 标注）", () => {
    const dangling: GraphDataset = {
      spaces: [{ id: "A", name: "a", type: "zone", parentId: "GHOST", description: "" }],
      assets: [],
      sensors: [],
    };
    const { edges, nodes } = layoutProject(dangling);
    expect(edges).toHaveLength(0);
    expect(nodes[0].isolated).toBe(true);
  });

  it("空数据集返回空图", () => {
    const { nodes, edges } = layoutProject({ spaces: [], assets: [], sensors: [] });
    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });
});
