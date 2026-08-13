import { describe, expect, it } from "vitest";
import {
  buildRecords,
  suggestMapping,
  validateImport,
  type Mapping,
} from "@/lib/import/mapping";

const SPACE_HEADERS = ["ID", "名称", "类型", "父级ID", "描述"];

describe("suggestMapping", () => {
  it("按表头精确匹配 Space 字段", () => {
    const m = suggestMapping(SPACE_HEADERS, "space");
    expect(m["ID"]).toBe("id");
    expect(m["名称"]).toBe("name");
    expect(m["类型"]).toBe("type");
    expect(m["父级ID"]).toBe("parentId");
    expect(m["描述"]).toBe("description");
  });

  it("按别名匹配（英文空格/下划线归一化）", () => {
    const m = suggestMapping(["space id", "space name", "space type", "parent", "desc"], "space");
    expect(m["space id"]).toBe("id");
    expect(m["space name"]).toBe("name");
    expect(m["space type"]).toBe("type");
    expect(m["parent"]).toBe("parentId");
    expect(m["desc"]).toBe("description");
  });

  it("未匹配列标记为不映射", () => {
    const m = suggestMapping(["ID", "随机备注列", "无关列"], "space");
    expect(m["ID"]).toBe("id");
    expect(m["随机备注列"]).toBeNull();
    expect(m["无关列"]).toBeNull();
  });

  it("一对一：同一源列不被两个目标复用", () => {
    const m = suggestMapping(["ID", "名称"], "space");
    // id/name 都匹配；其余目标无对应源，保持 null
    const targets = Object.values(m).filter(Boolean);
    expect(new Set(targets).size).toBe(targets.length);
  });
});

describe("buildRecords", () => {
  it("仅转换已映射字段并去空白", () => {
    const m = suggestMapping(SPACE_HEADERS, "space");
    const recs = buildRecords(
      [{ ID: " S1 ", 名称: "园区A", 类型: "park", 父级ID: "", 描述: "根园区" }],
      m,
    );
    expect(recs[0]).toEqual({
      id: "S1",
      name: "园区A",
      type: "park",
      parentId: "",
      description: "根园区",
    });
  });

  it("未映射列不进入记录", () => {
    const m: Mapping = { ID: "id", 名称: "name" };
    const recs = buildRecords([{ ID: "S1", 名称: "园区A", 垃圾列: "x" }], m);
    expect(recs[0]).toEqual({ id: "S1", name: "园区A" });
  });
});

describe("validateImport", () => {
  const validSpace = [
    { id: "S1", name: "园区A", type: "park", parentId: "", description: "根园区" },
    { id: "S2", name: "建筑B", type: "building", parentId: "S1", description: "主楼" },
  ];

  it("全部通过时 valid 计数正确、无错误", () => {
    const out = validateImport(validSpace, "space");
    expect(out.valid).toHaveLength(2);
    expect(out.errors).toHaveLength(0);
  });

  it("缺失必填字段给出带行号的中文错误", () => {
    const out = validateImport(
      [{ id: "", name: "x", type: "park", description: "" }],
      "space",
    );
    expect(out.valid).toHaveLength(0);
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0].row).toBe(1);
    expect(out.errors[0].message).toContain("ID不能为空");
  });

  it("枚举非法给出取值范围错误", () => {
    const out = validateImport(
      [{ id: "S1", name: "x", type: "planet", description: "" }],
      "space",
    );
    expect(out.errors[0].message).toContain("类型取值不在允许范围");
  });

  it("混合数据时分别统计通过与错误", () => {
    const out = validateImport([...validSpace, { id: "", name: "y", type: "park", description: "" }], "space");
    expect(out.valid).toHaveLength(2);
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0].row).toBe(3);
  });
});
