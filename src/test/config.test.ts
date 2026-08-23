import { describe, expect, it } from "vitest";
import {
  buildConfigPackage,
  buildConfigRules,
  defaultModelConfig,
  findEnum,
  findObjectType,
  isCoreType,
  migrateModelConfig,
  validateModelConfig,
} from "@/lib/config";
import {
  BUILTIN_PACKAGE,
  getEnabledRules,
} from "@/lib/rules/packages";
import { runRules } from "@/lib/rules/engine";
import { makeDataset } from "@/lib/rules/dataset";
import type { RuleDataset } from "@/lib/rules/types";

function sampleDataset(): RuleDataset {
  return makeDataset({
    spaces: [
      { id: "SP-001", name: "园区", type: "park", parentId: "", description: "" },
      { id: "SP-002", name: "楼", type: "building", parentId: "SP-001", description: "" },
    ],
    assets: [
      { id: "AS-001", name: "泵", type: "泵", spaceId: "SP-001", description: "" },
    ],
    sensors: [
      {
        id: "SE-001",
        name: "温度",
        assetId: "AS-001",
        quantity: "温度",
        unit: "°C",
        description: "",
      },
    ],
    observations: [],
  });
}

describe("ModelConfig schema", () => {
  it("默认配置结构正确（4 核心类型 + 空间类型枚举）", () => {
    const m = defaultModelConfig();
    expect(m.configVersion).toBe(1);
    expect(m.objectTypes.map((t) => t.id)).toEqual([
      "space",
      "asset",
      "sensor",
      "observation",
    ]);
    expect(findEnum(m, "spaceType")?.values).toContain("park");
    expect(findObjectType(m, "space")?.keyField).toBe("id");
  });

  it("isCoreType 判定正确", () => {
    expect(isCoreType("space")).toBe(true);
    expect(isCoreType("machine")).toBe(false);
  });

  it("合法配置通过校验", () => {
    const res = validateModelConfig(defaultModelConfig());
    expect(res.ok).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it("缺少必填字段被捕获并给出路径", () => {
    const bad = { ...defaultModelConfig(), name: "" };
    const res = validateModelConfig(bad);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.path === "name")).toBe(true);
  });

  it("enumRef / refType / keyField 引用缺失被捕获", () => {
    const m = defaultModelConfig();
    // 篡改 space 的 type 字段，引用不存在的枚举
    const space = m.objectTypes.find((t) => t.id === "space")!;
    space.fields = space.fields.map((f) =>
      f.key === "type" ? { ...f, enumRef: "nope" } : f,
    );
    const res = validateModelConfig(m);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.path.includes("enumRef"))).toBe(true);
  });

  it("migrateModelConfig 拒绝非 v1 版本", () => {
    expect(() => migrateModelConfig({ configVersion: 99, name: "x", objectTypes: [], enums: [] })).toThrow();
  });

  it("migrateModelConfig 接受 v1 默认配置", () => {
    expect(migrateModelConfig(defaultModelConfig()).configVersion).toBe(1);
  });
});

describe("配置驱动规则 buildConfigRules", () => {
  it("默认配置生成 4 类通用规则且确定性", () => {
    const rules = buildConfigRules(defaultModelConfig());
    const ids = rules.map((r) => r.id).sort();
    // space: id(req+uniq), name(req), type(enum), parentId(ref)
    expect(ids).toContain("C-space-id-req");
    expect(ids).toContain("C-space-id-uniq");
    expect(ids).toContain("C-space-name-req");
    expect(ids).toContain("C-space-type-enum");
    expect(ids).toContain("C-space-parentId-ref");
    // 两次调用结果一致
    expect(buildConfigRules(defaultModelConfig()).map((r) => r.id).sort()).toEqual(ids);
  });

  it("仅对核心四表生成规则（自定义类型被跳过）", () => {
    const m = defaultModelConfig();
    m.objectTypes.push({
      id: "machine",
      label: "机组",
      keyField: "id",
      fields: [{ key: "id", label: "ID", type: "string", required: true, unique: true }],
    });
    const ids = buildConfigRules(m).map((r) => r.id);
    expect(ids.some((i) => i.startsWith("C-machine-"))).toBe(false);
  });

  it("必填规则：空名称产生问题", () => {
    const ds = sampleDataset();
    ds.spaces[0].name = "   "; // 仅空白
    const report = runRules(ds, buildConfigRules(defaultModelConfig()));
    const issue = report.issues.find((i) => i.ruleId === "C-space-name-req");
    expect(issue).toBeTruthy();
    expect(issue!.recordId).toBe("SP-001");
  });

  it("枚举规则：非法空间类型产生问题", () => {
    const ds = sampleDataset();
    ds.spaces[0].type = "galaxy";
    const report = runRules(ds, buildConfigRules(defaultModelConfig()));
    expect(report.issues.some((i) => i.ruleId === "C-space-type-enum")).toBe(true);
  });

  it("引用规则：悬空 spaceId 产生问题（空间表有数据时不误报）", () => {
    const ds = sampleDataset();
    ds.assets[0].spaceId = "SP-999";
    const report = runRules(ds, buildConfigRules(defaultModelConfig()));
    const issue = report.issues.find((i) => i.ruleId === "C-asset-spaceId-ref");
    expect(issue).toBeTruthy();
    expect(issue!.message).toContain("SP-999");
  });

  it("唯一规则：重复 ID 产生问题并给出首次行号", () => {
    const ds = sampleDataset();
    ds.spaces[1].id = "SP-001";
    const report = runRules(ds, buildConfigRules(defaultModelConfig()));
    const issue = report.issues.find((i) => i.ruleId === "C-space-id-uniq");
    expect(issue).toBeTruthy();
    expect(issue!.message).toContain("第 1 行");
  });

  it("数据合规时配置规则零命中", () => {
    const report = runRules(sampleDataset(), buildConfigRules(defaultModelConfig()));
    expect(report.issues).toHaveLength(0);
  });
});

describe("规则包选择 getEnabledRules", () => {
  it("仅启用 config 包时只运行配置规则", () => {
    const cfgPkg = buildConfigPackage(defaultModelConfig());
    const rules = getEnabledRules([BUILTIN_PACKAGE, cfgPkg], ["config"]);
    expect(rules.every((r) => r.id.startsWith("C-"))).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });

  it("启用 builtin 包时包含 24 条内置规则", () => {
    const cfgPkg = buildConfigPackage(defaultModelConfig());
    const rules = getEnabledRules([BUILTIN_PACKAGE, cfgPkg], ["builtin"]);
    expect(rules.length).toBe(24);
  });

  it("同时启用两包，总规则数 = 24 + 配置规则数", () => {
    const cfgPkg = buildConfigPackage(defaultModelConfig());
    const rules = getEnabledRules([BUILTIN_PACKAGE, cfgPkg], ["builtin", "config"]);
    expect(rules.length).toBe(24 + cfgPkg.rules.length);
  });
});
