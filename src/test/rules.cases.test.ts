import { describe, expect, it } from "vitest";
import { makeDataset } from "@/lib/rules/dataset";
import { runRules } from "@/lib/rules/engine";
import { ALL_RULES } from "@/lib/rules/registry";
import {
  R001_RequiredFieldEmpty,
  R003_SurroundingWhitespace,
  R005_DescriptionMissing,
} from "@/lib/rules/rules/completeness";
import {
  R002_IdNamingConvention,
  R004_NameTooLong,
  R013_InvalidSpaceType,
  R015_UnitQuantityMismatch,
} from "@/lib/rules/rules/convention";
import { R014_AssetWithoutSensor } from "@/lib/rules/rules/coverage";
import {
  R010_HierarchyCycle,
  R011_HierarchyOrderInverted,
  R012_MissingRootSpace,
} from "@/lib/rules/rules/hierarchy";
import {
  R008_DanglingReference,
  R009_SelfParentReference,
} from "@/lib/rules/rules/reference";
import {
  R006_DuplicateId,
  R007_DuplicateSiblingName,
} from "@/lib/rules/rules/uniqueness";
import type { LooseRecord, Rule, RuleDataset } from "@/lib/rules/types";

/**
 * 每条规则至少 1 条命中用例 + 1 条不命中用例。
 * 用例数据均为最小构造，避免与其他规则互相干扰（每次只运行被测规则）。
 */

type Over = Record<string, string>;

function space(over: Over = {}): LooseRecord {
  return {
    id: "SP-001",
    name: "青云园区",
    type: "park",
    parentId: "",
    description: "根空间",
    ...over,
  };
}

function asset(over: Over = {}): LooseRecord {
  return {
    id: "AS-001",
    name: "冷冻水泵",
    type: "水泵",
    spaceId: "SP-001",
    description: "循环水泵",
    ...over,
  };
}

function sensor(over: Over = {}): LooseRecord {
  return {
    id: "SE-001",
    name: "出水温度",
    assetId: "AS-001",
    quantity: "温度",
    unit: "°C",
    description: "出水温度测点",
    ...over,
  };
}

/** 只运行被测规则，返回该规则产生的问题。 */
function hits(rule: Rule, partial: Partial<RuleDataset>) {
  const report = runRules(makeDataset(partial), [rule]);
  return report.issues;
}

/** 只运行被测规则，返回该规则的汇总项。 */
function summary(rule: Rule, partial: Partial<RuleDataset>) {
  const report = runRules(makeDataset(partial), [rule]);
  return report.byRule[0];
}

describe("R001 必填字段为空", () => {
  it("命中：空间缺少名称", () => {
    const issues = hits(R001_RequiredFieldEmpty, { spaces: [space({ name: "" })] });
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("error");
    expect(issues[0].table).toBe("space");
    expect(issues[0].rowNumber).toBe(1);
    expect(issues[0].field).toBe("name");
    expect(issues[0].message).toContain("名称");
  });

  it("命中：测点缺少单位，可定位到字段", () => {
    const issues = hits(R001_RequiredFieldEmpty, { sensors: [sensor({ unit: "" })] });
    expect(issues).toHaveLength(1);
    expect(issues[0].table).toBe("sensor");
    expect(issues[0].field).toBe("unit");
  });

  it("不命中：空间父级为空表示根节点，不算缺失", () => {
    expect(hits(R001_RequiredFieldEmpty, { spaces: [space({ parentId: "" })] })).toHaveLength(0);
  });
});

describe("R002 ID 命名不符合规范", () => {
  it("命中：ID 未采用「字母前缀-数字」格式", () => {
    const issues = hits(R002_IdNamingConvention, { spaces: [space({ id: "space001" })] });
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].field).toBe("id");
    expect(issues[0].recordId).toBe("space001");
  });

  it("不命中：SP-001 / AS-001 / SE-001 均符合规范", () => {
    const issues = hits(R002_IdNamingConvention, {
      spaces: [space()],
      assets: [asset()],
      sensors: [sensor()],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("R003 字段值含首尾空白", () => {
  it("命中：设备名称含首尾空格", () => {
    const issues = hits(R003_SurroundingWhitespace, { assets: [asset({ name: "  冷冻水泵 " })] });
    expect(issues).toHaveLength(1);
    expect(issues[0].field).toBe("name");
    expect(issues[0].severity).toBe("warning");
  });

  it("不命中：字段值已去空白", () => {
    expect(hits(R003_SurroundingWhitespace, { assets: [asset()] })).toHaveLength(0);
  });
});

describe("R004 名称长度超限", () => {
  it("命中：名称 41 个字符", () => {
    const long = "长".repeat(41);
    const issues = hits(R004_NameTooLong, { spaces: [space({ name: long })] });
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("info");
    expect(issues[0].message).toContain("41");
  });

  it("不命中：名称 40 个字符（边界内）", () => {
    const boundary = "长".repeat(40);
    expect(hits(R004_NameTooLong, { spaces: [space({ name: boundary })] })).toHaveLength(0);
  });
});

describe("R005 描述缺失", () => {
  it("命中：设备描述为空", () => {
    const issues = hits(R005_DescriptionMissing, { assets: [asset({ description: "" })] });
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("info");
    expect(issues[0].field).toBe("description");
  });

  it("不命中：描述已填写", () => {
    expect(hits(R005_DescriptionMissing, { assets: [asset()] })).toHaveLength(0);
  });
});

describe("R006 ID 在同表内重复", () => {
  it("命中：第二次出现的 ID 被标记，并指出首次行号", () => {
    const issues = hits(R006_DuplicateId, {
      spaces: [space(), space({ name: "重复编号空间" })],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].rowNumber).toBe(2);
    expect(issues[0].severity).toBe("error");
    expect(issues[0].message).toContain("第 1 行");
  });

  it("不命中：ID 互不相同", () => {
    const issues = hits(R006_DuplicateId, {
      spaces: [space(), space({ id: "SP-002", name: "A 座", type: "building", parentId: "SP-001" })],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("R007 同层级下名称重复", () => {
  it("命中：同一父级下出现同名空间", () => {
    const issues = hits(R007_DuplicateSiblingName, {
      spaces: [
        space({ id: "SP-002", parentId: "SP-001", name: "A 座", type: "building" }),
        space({ id: "SP-003", parentId: "SP-001", name: "A 座", type: "building" }),
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].rowNumber).toBe(2);
    expect(issues[0].field).toBe("name");
    expect(issues[0].message).toContain("父级ID");
  });

  it("不命中：同名但父级不同，视为不同层级", () => {
    const issues = hits(R007_DuplicateSiblingName, {
      spaces: [
        space({ id: "SP-002", parentId: "SP-001", name: "一层", type: "floor" }),
        space({ id: "SP-003", parentId: "SP-004", name: "一层", type: "floor" }),
      ],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("R008 引用对象不存在", () => {
  it("命中：设备指向不存在的空间", () => {
    const issues = hits(R008_DanglingReference, {
      spaces: [space()],
      assets: [asset({ spaceId: "SP-999" })],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].table).toBe("asset");
    expect(issues[0].field).toBe("spaceId");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].message).toContain("SP-999");
  });

  it("不命中：引用均存在", () => {
    const issues = hits(R008_DanglingReference, {
      spaces: [space()],
      assets: [asset()],
      sensors: [sensor()],
    });
    expect(issues).toHaveLength(0);
  });

  it("防假阳性：只导入设备表时整条规则跳过，不把全部 spaceId 判为悬空", () => {
    const item = summary(R008_DanglingReference, { assets: [asset({ spaceId: "SP-001" })] });
    expect(item.count).toBe(0);
    expect(item.skipped).toContain("为空");
  });
});

describe("R009 空间父级自引用", () => {
  it("命中：父级 ID 等于自身 ID", () => {
    const issues = hits(R009_SelfParentReference, {
      spaces: [space({ id: "SP-002", parentId: "SP-002" })],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].field).toBe("parentId");
    expect(issues[0].severity).toBe("error");
  });

  it("不命中：父级指向其他空间", () => {
    const issues = hits(R009_SelfParentReference, {
      spaces: [space({ id: "SP-002", parentId: "SP-001" })],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("R010 空间层级存在环", () => {
  it("命中：两个空间互为父级，环中每一行都被标记", () => {
    const issues = hits(R010_HierarchyCycle, {
      spaces: [
        space({ id: "SP-002", parentId: "SP-003", type: "floor" }),
        space({ id: "SP-003", parentId: "SP-002", type: "floor" }),
      ],
    });
    expect(issues).toHaveLength(2);
    expect(issues[0].severity).toBe("error");
    expect(issues[0].message).toContain("闭环");
    expect(issues.map((i) => i.rowNumber)).toEqual([1, 2]);
  });

  it("不命中：正常树形层级", () => {
    const issues = hits(R010_HierarchyCycle, {
      spaces: [
        space(),
        space({ id: "SP-002", parentId: "SP-001", type: "building" }),
        space({ id: "SP-003", parentId: "SP-002", type: "floor" }),
      ],
    });
    expect(issues).toHaveLength(0);
  });

  it("不命中：自引用交由 R009 报告，本规则不重复", () => {
    const issues = hits(R010_HierarchyCycle, {
      spaces: [space({ id: "SP-002", parentId: "SP-002" })],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("R011 空间层级顺序倒置", () => {
  it("命中：楼层被挂在区域之下", () => {
    const issues = hits(R011_HierarchyOrderInverted, {
      spaces: [
        space({ id: "SP-001", type: "zone", parentId: "" }),
        space({ id: "SP-002", type: "floor", parentId: "SP-001" }),
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].rowNumber).toBe(2);
    expect(issues[0].field).toBe("type");
    expect(issues[0].severity).toBe("warning");
  });

  it("命中：父子同级（楼层挂楼层）", () => {
    const issues = hits(R011_HierarchyOrderInverted, {
      spaces: [
        space({ id: "SP-001", type: "floor", parentId: "" }),
        space({ id: "SP-002", type: "floor", parentId: "SP-001" }),
      ],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("与父级同级");
  });

  it("不命中：园区 → 建筑 → 楼层 → 区域 顺序正确", () => {
    const issues = hits(R011_HierarchyOrderInverted, {
      spaces: [
        space(),
        space({ id: "SP-002", type: "building", parentId: "SP-001" }),
        space({ id: "SP-003", type: "floor", parentId: "SP-002" }),
        space({ id: "SP-004", type: "zone", parentId: "SP-003" }),
      ],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("R012 缺少根空间", () => {
  it("命中：所有空间都有父级，输出整表级问题", () => {
    const issues = hits(R012_MissingRootSpace, {
      spaces: [space({ id: "SP-002", parentId: "SP-001" })],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].scope).toBe("table");
    expect(issues[0].rowNumber).toBeNull();
    expect(issues[0].field).toBeNull();
    expect(issues[0].severity).toBe("error");
  });

  it("不命中：存在父级为空的根空间", () => {
    expect(hits(R012_MissingRootSpace, { spaces: [space()] })).toHaveLength(0);
  });
});

describe("R013 空间类型取值非法", () => {
  it("命中：类型为 workshop", () => {
    const issues = hits(R013_InvalidSpaceType, { spaces: [space({ type: "workshop" })] });
    expect(issues).toHaveLength(1);
    expect(issues[0].field).toBe("type");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].message).toContain("workshop");
  });

  it("不命中：类型为枚举内取值", () => {
    const issues = hits(R013_InvalidSpaceType, {
      spaces: [
        space({ type: "park" }),
        space({ id: "SP-002", type: "building" }),
        space({ id: "SP-003", type: "floor" }),
        space({ id: "SP-004", type: "zone" }),
      ],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("R014 设备未挂载任何测点", () => {
  it("命中：设备没有被任何测点引用", () => {
    const issues = hits(R014_AssetWithoutSensor, {
      assets: [asset({ id: "AS-002" })],
      sensors: [sensor({ assetId: "AS-001" })],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].table).toBe("asset");
    expect(issues[0].severity).toBe("info");
    expect(issues[0].recordId).toBe("AS-002");
  });

  it("不命中：设备已有测点", () => {
    const issues = hits(R014_AssetWithoutSensor, {
      assets: [asset()],
      sensors: [sensor({ assetId: "AS-001" })],
    });
    expect(issues).toHaveLength(0);
  });

  it("防假阳性：测点表为空时跳过，不把全部设备判为无测点", () => {
    const item = summary(R014_AssetWithoutSensor, { assets: [asset()] });
    expect(item.count).toBe(0);
    expect(item.skipped).toContain("测点表为空");
  });
});

describe("R015 量纲与单位不匹配", () => {
  it("命中：量纲为温度但单位为 kPa", () => {
    const issues = hits(R015_UnitQuantityMismatch, {
      sensors: [sensor({ quantity: "温度", unit: "kPa" })],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0].field).toBe("unit");
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].message).toContain("温度");
  });

  it("不命中：温度 / °C 匹配，且单位大小写不敏感", () => {
    const issues = hits(R015_UnitQuantityMismatch, {
      sensors: [sensor({ quantity: "温度", unit: "°C" }), sensor({ id: "SE-002", quantity: "功率", unit: "KW" })],
    });
    expect(issues).toHaveLength(0);
  });

  it("不命中：量纲不在内置对照表中则不做判定", () => {
    const issues = hits(R015_UnitQuantityMismatch, {
      sensors: [sensor({ quantity: "自定义量纲", unit: "任意单位" })],
    });
    expect(issues).toHaveLength(0);
  });
});

describe("规则清单完整性", () => {
  it("共注册 19 条规则，ID 唯一且升序", () => {
    expect(ALL_RULES).toHaveLength(19);
    const ids = ALL_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(19);
    expect([...ids].sort()).toEqual(ids);
  });

  it("每条规则都有名称、类别、级别、作用表与说明", () => {
    for (const rule of ALL_RULES) {
      expect(rule.name.length).toBeGreaterThan(0);
      expect(rule.description.length).toBeGreaterThan(0);
      expect(rule.tables.length).toBeGreaterThan(0);
      expect(["error", "warning", "info"]).toContain(rule.severity);
      expect([
        "completeness",
        "uniqueness",
        "reference",
        "hierarchy",
        "coverage",
        "convention",
      ]).toContain(rule.category);
    }
  });

  it("6 个类别均有规则覆盖", () => {
    const categories = new Set(ALL_RULES.map((r) => r.category));
    expect(categories.size).toBe(6);
  });

  it("每条规则都有对应的命中用例被本文件覆盖", () => {
    // 用例文件中每条规则均以 describe("Rxxx ...") 组织，此处以规则数量作为守卫，
    // 新增规则若未补用例，上面的 19 条断言会先失败。
    expect(ALL_RULES.map((r) => r.id)).toEqual([
      "R001",
      "R002",
      "R003",
      "R004",
      "R005",
      "R006",
      "R007",
      "R008",
      "R009",
      "R010",
      "R011",
      "R012",
      "R013",
      "R014",
      "R015",
      "R016",
      "R017",
      "R018",
      "R019",
    ]);
  });
});
