import { describe, expect, it } from "vitest";
import type { ProjectState } from "@/lib/project/types";
import { EMPTY_METADATA } from "@/lib/project/types";
import { searchProject } from "@/lib/project/search";
import { parseProjectFile, serializeProject } from "@/lib/project/io";
import { migrateProjectV1ToV2 } from "@/lib/project/persist";

function makeState(partial: Partial<ProjectState> = {}): ProjectState {
  return {
    version: 2,
    source: "import",
    spaces: partial.spaces ?? [],
    assets: partial.assets ?? [],
    sensors: partial.sensors ?? [],
    observations: partial.observations ?? [],
    metadata: partial.metadata,
    updatedAt: "",
  };
}

describe("searchProject 跨表检索", () => {
  const state = makeState({
    spaces: [{ id: "SP-001", name: "一号厂房" }],
    assets: [{ id: "AS-001", name: "离心泵" }],
    sensors: [{ id: "SN-001", name: "轴承温度", quantity: "温度", unit: "°C" }],
    observations: [{ id: "OB-101", name: "轴承温度观测", quantity: "温度", unit: "°C" }],
  });

  it("按 ID 片段命中（大小写不敏感）", () => {
    const hits = searchProject(state, "sn-001");
    expect(hits).toHaveLength(1);
    expect(hits[0].table).toBe("sensors");
    expect(hits[0].matchedField).toBe("id");
    expect(hits[0].recordId).toBe("SN-001");
  });

  it("按名称片段跨四表命中", () => {
    const hits = searchProject(state, "温度");
    const tables = hits.map((h) => h.table).sort();
    expect(tables).toEqual(["observations", "sensors"]);
    expect(hits.every((h) => h.matchedField === "name")).toBe(true);
  });

  it("空查询 / 纯空白查询返回空数组", () => {
    expect(searchProject(state, "")).toEqual([]);
    expect(searchProject(state, "   ")).toEqual([]);
  });

  it("无命中返回空数组", () => {
    expect(searchProject(state, "不存在的关键词")).toEqual([]);
  });

  it("limit 截断生效且顺序确定（表序 → 行序）", () => {
    const big = makeState({
      spaces: [
        { id: "SP-001", name: "AA" },
        { id: "SP-002", name: "AB" },
        { id: "SP-003", name: "AC" },
      ],
      assets: [{ id: "AS-001", name: "AA2" }],
    });
    const all = searchProject(big, "a");
    expect(all.length).toBeGreaterThan(2);
    const capped = searchProject(big, "a", 2);
    expect(capped).toHaveLength(2);
    expect(capped[0].rowIndex).toBe(0);
    expect(capped[1].rowIndex).toBe(1);
  });

  it("name 缺失时退回命中字段值作为展示名", () => {
    const hit = searchProject(makeState({ assets: [{ id: "AS-001" }] }), "AS-001");
    expect(hit[0].name).toBe("AS-001");
  });
});

describe("元信息在导入导出中的往返", () => {
  it("serializeProject 携带 metadata，parseProjectFile 原样恢复", () => {
    const state = makeState({
      metadata: { name: "华东工厂", description: "一期数字孪生", owner: "Hunter" },
    });
    const json = serializeProject(state, { name: "文件别名" });
    const { state: parsed, warnings } = parseProjectFile(json);
    expect(warnings).toEqual([]);
    expect(parsed.metadata).toEqual(state.metadata);
  });

  it("无 metadata 的旧项目解析后保持 undefined（兼容）", () => {
    const json = serializeProject(makeState());
    const { state: parsed } = parseProjectFile(json);
    expect(parsed.metadata).toBeUndefined();
  });

  it("裸 ProjectState（无外壳）解析同样恢复 metadata", () => {
    const state = makeState({ metadata: { name: "X", description: "", owner: "" } });
    const parsed = parseProjectFile(JSON.stringify(state));
    expect(parsed.state.metadata).toEqual(state.metadata);
  });

  it("metadata 形状非法时按空元信息处理（宽松强制转换）", () => {
    const raw = JSON.stringify({
      version: 2,
      source: "import",
      spaces: [],
      assets: [],
      sensors: [],
      observations: [],
      metadata: { name: 123, owner: null },
      updatedAt: "",
    });
    const { state: parsed } = parseProjectFile(raw);
    expect(parsed.metadata).toEqual({ name: "", description: "", owner: "" });
  });

  it("v1 项目迁移后无 metadata（旧格式不含）", () => {
    const migrated = migrateProjectV1ToV2({
      source: "demo",
      spaces: [],
      assets: [],
      sensors: [],
    });
    expect(migrated.metadata).toBeUndefined();
    expect(EMPTY_METADATA).toEqual({ name: "", description: "", owner: "" });
  });
});
