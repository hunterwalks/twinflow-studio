import { describe, expect, it } from "vitest";
import { IndustrialParkSchema, SpaceSchema } from "@/lib/types";

describe("Zod 领域模型", () => {
  it("合法 Space 通过校验", () => {
    const ok = SpaceSchema.safeParse({
      id: "SP-001",
      name: "青云智慧产业园",
      type: "park",
      parentId: null,
      description: "园区级根空间对象",
    });
    expect(ok.success).toBe(true);
  });

  it("非法的 Space 类型被拒绝", () => {
    const bad = SpaceSchema.safeParse({
      id: "SP-X",
      name: "x",
      type: "galaxy",
      parentId: null,
      description: "d",
    });
    expect(bad.success).toBe(false);
  });

  it("parentId 为空字符串时失败（应为 null 或有效 ID）", () => {
    const bad = SpaceSchema.safeParse({
      id: "SP-X",
      name: "x",
      type: "floor",
      parentId: "",
      description: "d",
    });
    expect(bad.success).toBe(false);
  });

  it("完整工业园区结构通过校验", () => {
    const ok = IndustrialParkSchema.safeParse({
      spaces: [{ id: "S1", name: "n", type: "park", parentId: null, description: "d" }],
      assets: [{ id: "A1", name: "n", type: "t", spaceId: "S1", description: "d" }],
      sensors: [{ id: "SE1", name: "n", assetId: "A1", quantity: "温度", unit: "°C", description: "d" }],
    });
    expect(ok.success).toBe(true);
  });
});
