import { describe, expect, it } from "vitest";
import { serializeProject, parseProjectFile } from "@/lib/project/io";
import { EMPTY_PROJECT, type ProjectState } from "@/lib/project/types";
import { defaultModelConfig } from "@/lib/config/model";

function makeSample(): ProjectState {
  return {
    version: 2,
    source: "demo",
    spaces: [{ id: "SP-1", name: "园区", type: "park", parentId: "", description: "" }],
    assets: [{ id: "AS-1", name: "设备", type: "x", spaceId: "SP-1", description: "" }],
    sensors: [
      { id: "SE-1", name: "测点", assetId: "AS-1", quantity: "温度", unit: "℃", description: "" },
    ],
    observations: [
      { id: "OB-1", sensorId: "SE-1", timestamp: "2026-01-01T00:00:00Z", value: "1.2" },
    ],
    modelConfig: defaultModelConfig(),
    updatedAt: "2026-08-16T00:00:00.000Z",
  };
}

describe("项目 JSON 导入/导出（v0.8.0）", () => {
  it("序列化后可原样解析（四表往返一致）", () => {
    const sample = makeSample();
    const json = serializeProject(sample, { name: "样例" });
    const { state } = parseProjectFile(json);
    expect(state.version).toBe(2);
    expect(state.source).toBe("demo");
    expect(state.spaces).toEqual(sample.spaces);
    expect(state.assets).toEqual(sample.assets);
    expect(state.sensors).toEqual(sample.sensors);
    expect(state.observations).toEqual(sample.observations);
    expect(state.modelConfig).toEqual(sample.modelConfig);
    expect(state.updatedAt).toBe(sample.updatedAt);
  });

  it("兼容裸 ProjectState（无外壳）", () => {
    const { state, warnings } = parseProjectFile(JSON.stringify(makeSample()));
    expect(state.observations).toHaveLength(1);
    expect(warnings).toEqual([]);
  });

  it("v1 旧项目（三表）自动迁移为 v2，观测表为空并给出提示", () => {
    const v1 = {
      version: 1,
      source: "demo",
      spaces: [{ id: "SP-1", name: "园区", type: "park", parentId: "", description: "" }],
      assets: [{ id: "AS-1", name: "设备", type: "x", spaceId: "SP-1", description: "" }],
      sensors: [
        { id: "SE-1", name: "测点", assetId: "AS-1", quantity: "温度", unit: "℃", description: "" },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const { state, warnings } = parseProjectFile(JSON.stringify(v1));
    expect(state.version).toBe(2);
    expect(state.observations).toEqual([]);
    expect(state.spaces).toHaveLength(1);
    expect(warnings.some((w) => w.includes("v1"))).toBe(true);
  });

  it("字段缺失/畸形时按空表处理并给出 warning", () => {
    const broken = { version: 2, source: "project", spaces: "not-an-array" };
    const { state, warnings } = parseProjectFile(JSON.stringify(broken));
    expect(state.spaces).toEqual([]);
    expect(warnings.some((w) => w.includes("spaces"))).toBe(true);
  });

  it("非法 JSON 抛出可读错误", () => {
    expect(() => parseProjectFile("{not json")).toThrow();
  });

  it("缺少 version 字段时抛错", () => {
    expect(() => parseProjectFile(JSON.stringify({ foo: 1 }))).toThrow(/version/);
  });

  it("不支持的版本号抛错", () => {
    expect(() => parseProjectFile(JSON.stringify({ version: 99 }))).toThrow(/版本/);
  });

  it("空项目可往返", () => {
    const json = serializeProject(EMPTY_PROJECT);
    const { state } = parseProjectFile(json);
    expect(state.spaces).toEqual([]);
    expect(state.observations).toEqual([]);
  });
});
