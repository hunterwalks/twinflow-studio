import { describe, expect, it } from "vitest";
import { industrialPark } from "@/lib/data/industrialPark";
import { IndustrialParkSchema } from "@/lib/types";

describe("合成工业园区数据完整性", () => {
  it("通过领域模型校验（导出即校验）", () => {
    expect(() => IndustrialParkSchema.parse(industrialPark)).not.toThrow();
  });

  it("至少包含 Space / Asset / Sensor 三类记录", () => {
    expect(industrialPark.spaces.length).toBeGreaterThan(0);
    expect(industrialPark.assets.length).toBeGreaterThan(0);
    expect(industrialPark.sensors.length).toBeGreaterThan(0);
  });

  it("每个 Space 的 parentId 要么为空，要么指向已存在的 Space", () => {
    const ids = new Set(industrialPark.spaces.map((s) => s.id));
    for (const s of industrialPark.spaces) {
      if (s.parentId !== null) {
        expect(ids.has(s.parentId), `Space ${s.id} 的父级 ${s.parentId} 不存在`).toBe(true);
      }
    }
  });

  it("每个 Asset 的 spaceId 指向已存在的 Space", () => {
    const ids = new Set(industrialPark.spaces.map((s) => s.id));
    for (const a of industrialPark.assets) {
      expect(ids.has(a.spaceId), `Asset ${a.id} 的空间 ${a.spaceId} 不存在`).toBe(true);
    }
  });

  it("每个 Sensor 的 assetId 指向已存在的 Asset", () => {
    const ids = new Set(industrialPark.assets.map((a) => a.id));
    for (const se of industrialPark.sensors) {
      expect(ids.has(se.assetId), `Sensor ${se.id} 的资产 ${se.assetId} 不存在`).toBe(true);
    }
  });

  it("所有对象 ID 唯一", () => {
    const allIds = [
      ...industrialPark.spaces.map((s) => s.id),
      ...industrialPark.assets.map((a) => a.id),
      ...industrialPark.sensors.map((s) => s.id),
    ];
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
