import { describe, expect, it } from "vitest";
import { detectOrphans } from "@/lib/graph/orphans";
import type { GraphDataset } from "@/lib/graph/types";

const clean: GraphDataset = {
  spaces: [
    { id: "ROOT", name: "园区", type: "park", parentId: "", description: "" },
    { id: "B", name: "楼", type: "building", parentId: "ROOT", description: "" },
  ],
  assets: [{ id: "A1", name: "泵", type: "pump", spaceId: "B", description: "" }],
  sensors: [
    { id: "S1", name: "温", assetId: "A1", quantity: "温度", unit: "℃", description: "" },
  ],
};

describe("孤立/悬空对象 detectOrphans", () => {
  it("干净数据无孤立对象", () => {
    const r = detectOrphans(clean);
    expect(r.isolated.size).toBe(0);
  });

  it("父级指向不存在的空间 → 标记为孤立", () => {
    const d: GraphDataset = {
      spaces: [{ id: "A", name: "a", type: "zone", parentId: "X", description: "" }],
      assets: [],
      sensors: [],
    };
    const r = detectOrphans(d);
    expect(r.isolated.has("space#A")).toBe(true);
    expect(r.reasons["space#A"]).toContain("悬空引用");
  });

  it("父级指向存在的空间 → 不标记", () => {
    const r = detectOrphans(clean);
    expect(r.isolated.has("space#B")).toBe(false);
  });

  it("资产所属空间不存在（空间表非空）→ 标记资产孤立", () => {
    const d: GraphDataset = {
      spaces: [{ id: "S1", name: "s", type: "park", parentId: "", description: "" }],
      assets: [{ id: "A1", name: "泵", type: "pump", spaceId: "NOPE", description: "" }],
      sensors: [],
    };
    const r = detectOrphans(d);
    expect(r.isolated.has("asset#A1")).toBe(true);
  });

  it("被引用表为空时跳过跨表悬空判定（不产生假阳性）", () => {
    const d: GraphDataset = {
      spaces: [],
      assets: [{ id: "A1", name: "泵", type: "pump", spaceId: "NOPE", description: "" }],
      sensors: [],
    };
    const r = detectOrphans(d);
    expect(r.isolated.has("asset#A1")).toBe(false);
  });

  it("传感器所属设备不存在 → 标记孤立", () => {
    const d: GraphDataset = {
      spaces: [{ id: "S1", name: "s", type: "park", parentId: "", description: "" }],
      assets: [{ id: "A1", name: "泵", type: "pump", spaceId: "S1", description: "" }],
      sensors: [{ id: "S1", name: "温", assetId: "GHOST", quantity: "温度", unit: "℃", description: "" }],
    };
    const r = detectOrphans(d);
    expect(r.isolated.has("sensor#S1")).toBe(true);
  });

  it("空间环（无根可达）中的节点标记为不可达孤立", () => {
    const d: GraphDataset = {
      spaces: [
        { id: "ROOT", name: "园区", type: "park", parentId: "", description: "" },
        { id: "B", name: "楼", type: "building", parentId: "ROOT", description: "" },
        { id: "C", name: "c", type: "floor", parentId: "D", description: "" },
        { id: "D", name: "d", type: "floor", parentId: "C", description: "" },
      ],
      assets: [],
      sensors: [],
    };
    const r = detectOrphans(d);
    expect(r.isolated.has("space#C")).toBe(true);
    expect(r.isolated.has("space#D")).toBe(true);
    expect(r.isolated.has("space#B")).toBe(false);
  });
});
