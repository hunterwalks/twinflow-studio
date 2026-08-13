/**
 * 规范性类规则：R002 ID 命名不符合规范 / R004 名称长度超限 / R013 空间类型取值非法 / R015 量纲与单位不匹配
 */

import { indexed, rowIssue, tableRecords, val } from "../dataset";
import { defineRule } from "../define";
import {
  ID_PATTERN,
  NAME_MAX_LENGTH,
  SPACE_TYPE_VALUES,
  UNITS_BY_QUANTITY,
  knownQuantity,
  unitMatches,
} from "../spec";
import type { Issue, TableName } from "../types";

const TABLES: TableName[] = ["space", "asset", "sensor"];

export const R002_IdNamingConvention = defineRule(
  {
    id: "R002",
    name: "ID 命名不符合规范",
    category: "convention",
    severity: "warning",
    tables: TABLES,
    description:
      "ID 建议采用「2—4 位字母前缀 + 短横线 + 至少 3 位数字」，例如 SP-001 / AS-001 / SE-001。统一编码有利于跨表核对与批量维护。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const table of TABLES) {
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        const id = val(rec, "id");
        if (id === "") continue; // 空 ID 由 R001 负责
        if (ID_PATTERN.test(id)) continue;
        issues.push(
          rowIssue(
            rule,
            table,
            rowNumber,
            rec,
            "id",
            `ID「${id}」不符合命名规范（应形如 SP-001）`,
            "改为统一编码格式，或在项目层面明确另一套编码规则后调整本规则。",
          ),
        );
      }
    }
    return issues;
  },
);

export const R004_NameTooLong = defineRule(
  {
    id: "R004",
    name: "名称长度超限",
    category: "convention",
    severity: "info",
    tables: TABLES,
    description: `名称超过 ${NAME_MAX_LENGTH} 个字符。过长名称会在树形导航、图表标签与报告中被截断。`,
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const table of TABLES) {
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        const name = val(rec, "name");
        if (name.length <= NAME_MAX_LENGTH) continue;
        issues.push(
          rowIssue(
            rule,
            table,
            rowNumber,
            rec,
            "name",
            `名称长度 ${name.length} 字符，超过 ${NAME_MAX_LENGTH} 字符上限`,
            "精简名称主体，把补充信息移到描述字段。",
          ),
        );
      }
    }
    return issues;
  },
);

export const R013_InvalidSpaceType = defineRule(
  {
    id: "R013",
    name: "空间类型取值非法",
    category: "convention",
    severity: "error",
    tables: ["space"],
    description: `空间类型必须是 ${SPACE_TYPE_VALUES.join(" / ")} 之一。非法取值会导致模型校验失败、层级判定无法进行。`,
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, "space"))) {
      const type = val(rec, "type");
      if (type === "") continue; // 空值由 R001 负责
      if (SPACE_TYPE_VALUES.includes(type)) continue;
      issues.push(
        rowIssue(
          rule,
          "space",
          rowNumber,
          rec,
          "type",
          `类型「${type}」不在允许范围（${SPACE_TYPE_VALUES.join(" / ")}）`,
          "把类型改为允许值之一；中文表头数据可在导入映射阶段先做取值转换。",
        ),
      );
    }
    return issues;
  },
);

export const R015_UnitQuantityMismatch = defineRule(
  {
    id: "R015",
    name: "量纲与单位不匹配",
    category: "convention",
    severity: "warning",
    tables: ["sensor"],
    description:
      "测点的单位与其量纲不匹配（如量纲为温度、单位为 kPa）。单位错误会让后续告警阈值与统计口径全部失真。量纲不在内置对照表中的记录会被跳过，不做判定。",
    skipReason: (ctx) => (ctx.hasTable.sensor ? null : "测点表为空，无量纲可校验"),
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, "sensor"))) {
      const quantity = val(rec, "quantity");
      const unit = val(rec, "unit");
      if (quantity === "" || unit === "") continue; // 空值由 R001 负责
      if (!knownQuantity(quantity)) continue; // 未知量纲不做判定，避免假阳性
      if (unitMatches(quantity, unit)) continue;
      const allowed = UNITS_BY_QUANTITY[quantity].join(" / ");
      issues.push(
        rowIssue(
          rule,
          "sensor",
          rowNumber,
          rec,
          "unit",
          `量纲「${quantity}」与单位「${unit}」不匹配（该量纲允许：${allowed}）`,
          "核对现场点表，修正单位；若确为项目特有单位，请扩充量纲对照表。",
        ),
      );
    }
    return issues;
  },
);
