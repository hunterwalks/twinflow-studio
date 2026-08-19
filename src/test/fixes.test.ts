import { describe, expect, it } from "vitest";
import type { Issue } from "@/lib/rules/types";
import type { ProjectState } from "@/lib/project/types";
import { applyFix, proposeFix, type ProposedFix } from "@/lib/fixes";

/** 构造最小 ProjectState，便于定点测试修复引擎。 */
function makeState(partial: Partial<ProjectState> = {}): ProjectState {
  return {
    version: 2,
    source: "import",
    spaces: partial.spaces ?? [],
    assets: partial.assets ?? [],
    sensors: partial.sensors ?? [],
    observations: partial.observations ?? [],
    updatedAt: "",
  };
}

/** 用给定的 ruleId / table / rowNumber / field 造一条最小 Issue。 */
function issue(p: Partial<Issue> & Pick<Issue, "ruleId" | "table" | "rowNumber" | "field">): Issue {
  return {
    ruleName: p.ruleId,
    category: "convention",
    severity: "warning",
    scope: "row",
    recordId: null,
    message: "",
    hint: "",
    ...p,
  } as Issue;
}

describe("proposeFix", () => {
  it("R003 字段首尾空白 → 去空白", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "  AB  " }] });
    const fix = proposeFix(issue({ ruleId: "R003", table: "sensor", rowNumber: 1, field: "name" }), state);
    expect(fix).not.toBeNull();
    expect(fix!.table).toBe("sensors");
    expect(fix!.rowIndex).toBe(0);
    expect(fix!.field).toBe("name");
    expect(fix!.current).toBe("  AB  ");
    expect(fix!.proposed).toBe("AB");
  });

  it("R003 无空白 → 返回 null（无需修复）", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "AB" }] });
    const fix = proposeFix(issue({ ruleId: "R003", table: "sensor", rowNumber: 1, field: "name" }), state);
    expect(fix).toBeNull();
  });

  it("R004 名称过长 → 截断至 40 字符", () => {
    const long = "X".repeat(45);
    const state = makeState({ sensors: [{ id: "SN-001", name: long }] });
    const fix = proposeFix(issue({ ruleId: "R004", table: "sensor", rowNumber: 1, field: "name" }), state);
    expect(fix).not.toBeNull();
    expect(fix!.proposed).toBe("X".repeat(40));
    expect(fix!.proposed.length).toBe(40);
  });

  it("R004 名称未超长 → 返回 null", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "X".repeat(40) }] });
    const fix = proposeFix(issue({ ruleId: "R004", table: "sensor", rowNumber: 1, field: "name" }), state);
    expect(fix).toBeNull();
  });

  it("R009 空间父级自引用 → 置为根节点（空）", () => {
    const state = makeState({ spaces: [{ id: "SP-001", parentId: "SP-001" }] });
    const fix = proposeFix(issue({ ruleId: "R009", table: "space", rowNumber: 1, field: "parentId" }), state);
    expect(fix).not.toBeNull();
    expect(fix!.table).toBe("spaces");
    expect(fix!.field).toBe("parentId");
    expect(fix!.proposed).toBe("");
  });

  it("R009 父级已为空 → 返回 null", () => {
    const state = makeState({ spaces: [{ id: "SP-001", parentId: "" }] });
    const fix = proposeFix(issue({ ruleId: "R009", table: "space", rowNumber: 1, field: "parentId" }), state);
    expect(fix).toBeNull();
  });

  it("R015 量纲与单位不匹配 → 归一为量纲标准单位", () => {
    const state = makeState({ sensors: [{ id: "SN-001", quantity: "温度", unit: "kPa" }] });
    const fix = proposeFix(issue({ ruleId: "R015", table: "sensor", rowNumber: 1, field: "unit" }), state);
    expect(fix).not.toBeNull();
    expect(fix!.field).toBe("unit");
    expect(fix!.proposed).toBe("°C");
  });

  it("R015 单位已匹配 → 返回 null", () => {
    const state = makeState({ sensors: [{ id: "SN-001", quantity: "温度", unit: "°C" }] });
    const fix = proposeFix(issue({ ruleId: "R015", table: "sensor", rowNumber: 1, field: "unit" }), state);
    expect(fix).toBeNull();
  });

  it("R015 未知量纲 → 返回 null（避免假阳性）", () => {
    const state = makeState({ sensors: [{ id: "SN-001", quantity: "XYZ", unit: "kPa" }] });
    const fix = proposeFix(issue({ ruleId: "R015", table: "sensor", rowNumber: 1, field: "unit" }), state);
    expect(fix).toBeNull();
  });

  it("R020 观测量纲与单位不匹配 → 归一为量纲标准单位", () => {
    const state = makeState({ observations: [{ id: "OB-001", quantity: "温度", unit: "kPa" }] });
    const fix = proposeFix(issue({ ruleId: "R020", table: "observation", rowNumber: 1, field: "unit" }), state);
    expect(fix).not.toBeNull();
    expect(fix!.table).toBe("observations");
    expect(fix!.field).toBe("unit");
    expect(fix!.proposed).toBe("°C");
  });

  it("不可自动修复的规则（如 R001 必填缺失）→ 返回 null", () => {
    const state = makeState({ sensors: [{ id: "", name: "" }] });
    const fix = proposeFix(issue({ ruleId: "R001", table: "sensor", rowNumber: 1, field: "name" }), state);
    expect(fix).toBeNull();
  });

  it("rowNumber 越界 → 返回 null", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "  AB  " }] });
    const fix = proposeFix(issue({ ruleId: "R003", table: "sensor", rowNumber: 5, field: "name" }), state);
    expect(fix).toBeNull();
  });
});

describe("applyFix", () => {
  it("应用前 current 匹配 → 修改目标字段并返回新状态", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "  AB  " }] });
    const fix: ProposedFix = {
      table: "sensors",
      rowIndex: 0,
      field: "name",
      current: "  AB  ",
      proposed: "AB",
      description: "去除字段首尾空白。",
    };
    const next = applyFix(state, fix);
    expect(next).not.toBe(state);
    expect(next.sensors[0].name).toBe("AB");
  });

  it("原状态不被修改（不可变更新）", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "  AB  " }] });
    const original = state.sensors[0];
    const fix: ProposedFix = {
      table: "sensors",
      rowIndex: 0,
      field: "name",
      current: "  AB  ",
      proposed: "AB",
      description: "",
    };
    const next = applyFix(state, fix);
    expect(state.sensors[0].name).toBe("  AB  ");
    expect(next.sensors).not.toBe(state.sensors);
    expect(next.sensors[0]).not.toBe(original);
  });

  it("current 已被并发改动 → 放弃应用并返回原状态引用", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "  AB  " }] });
    const fix: ProposedFix = {
      table: "sensors",
      rowIndex: 0,
      field: "name",
      current: "STALE",
      proposed: "AB",
      description: "",
    };
    const next = applyFix(state, fix);
    expect(next).toBe(state);
    expect(state.sensors[0].name).toBe("  AB  ");
  });

  it("rowIndex 越界 → 返回原状态引用（不报错）", () => {
    const state = makeState({ sensors: [{ id: "SN-001", name: "  AB  " }] });
    const fix: ProposedFix = {
      table: "sensors",
      rowIndex: 9,
      field: "name",
      current: "  AB  ",
      proposed: "AB",
      description: "",
    };
    expect(applyFix(state, fix)).toBe(state);
  });
});
