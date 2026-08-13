/**
 * 完整性类规则：R001 必填字段为空 / R003 字段值含首尾空白 / R005 描述缺失
 */

import { indexed, raw, rowIssue, tableRecords, val } from "../dataset";
import { defineRule } from "../define";
import { ALL_FIELDS, REQUIRED_FIELDS, fieldLabel } from "../spec";
import type { Issue, TableName } from "../types";

const TABLES: TableName[] = ["space", "asset", "sensor"];

export const R001_RequiredFieldEmpty = defineRule(
  {
    id: "R001",
    name: "必填字段为空",
    category: "completeness",
    severity: "error",
    tables: TABLES,
    description:
      "空间需要 ID / 名称 / 类型；设备需要 ID / 名称 / 类型 / 空间ID；测点需要 ID / 名称 / 设备ID / 量纲 / 单位。缺失将无法建立对象。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const table of TABLES) {
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        for (const field of REQUIRED_FIELDS[table]) {
          if (val(rec, field) === "") {
            issues.push(
              rowIssue(
                rule,
                table,
                rowNumber,
                rec,
                field,
                `${fieldLabel(field)}为空`,
                `补全该行的${fieldLabel(field)}；若该记录本身无效，请从数据源中删除该行。`,
              ),
            );
          }
        }
      }
    }
    return issues;
  },
);

export const R003_SurroundingWhitespace = defineRule(
  {
    id: "R003",
    name: "字段值含首尾空白",
    category: "completeness",
    severity: "warning",
    tables: TABLES,
    description:
      "字段值存在前导或尾随空格。空白字符会导致 ID 匹配失败、名称去重失效，属于常见的表格脏数据。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const table of TABLES) {
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        for (const field of ALL_FIELDS[table]) {
          const original = raw(rec, field);
          const trimmed = original.trim();
          if (trimmed !== "" && original !== trimmed) {
            issues.push(
              rowIssue(
                rule,
                table,
                rowNumber,
                rec,
                field,
                `${fieldLabel(field)}存在首尾空白字符（原值「${original}」）`,
                "在数据源中清除该单元格的首尾空格，或导入时统一做去空白处理。",
              ),
            );
          }
        }
      }
    }
    return issues;
  },
);

export const R005_DescriptionMissing = defineRule(
  {
    id: "R005",
    name: "描述缺失",
    category: "completeness",
    severity: "info",
    tables: TABLES,
    description:
      "描述字段为空。描述不影响建模，但会降低后续交付物与报告的可读性，建议在正式交付前补全。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const table of TABLES) {
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        if (val(rec, "description") === "") {
          issues.push(
            rowIssue(
              rule,
              table,
              rowNumber,
              rec,
              "description",
              "描述为空",
              "补充一句用途或位置说明，便于交付评审与后续维护。",
            ),
          );
        }
      }
    }
    return issues;
  },
);
