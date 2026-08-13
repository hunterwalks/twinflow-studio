/**
 * 唯一性类规则：R006 ID 在同表内重复 / R007 同层级下名称重复
 *
 * 约定：重复组中的首次出现不报问题，仅对第 2 次及之后的出现报问题，
 * 并在描述中给出首次出现的行号，便于用户直接比对。
 */

import { indexed, rowIssue, tableRecords, val } from "../dataset";
import { defineRule } from "../define";
import { SIBLING_GROUP_FIELD, fieldLabel } from "../spec";
import type { Issue, TableName } from "../types";

const TABLES: TableName[] = ["space", "asset", "sensor"];

export const R006_DuplicateId = defineRule(
  {
    id: "R006",
    name: "ID 在同表内重复",
    category: "uniqueness",
    severity: "error",
    tables: TABLES,
    description:
      "同一张表内出现相同 ID。ID 是对象唯一标识，重复会导致引用指向不确定、后续覆盖丢数据。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const table of TABLES) {
      const firstSeen = new Map<string, number>();
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        const id = val(rec, "id");
        if (id === "") continue; // 空 ID 由 R001 负责
        const first = firstSeen.get(id);
        if (first === undefined) {
          firstSeen.set(id, rowNumber);
          continue;
        }
        issues.push(
          rowIssue(
            rule,
            table,
            rowNumber,
            rec,
            "id",
            `ID「${id}」与第 ${first} 行重复`,
            "为该记录改用唯一 ID，或确认是否为重复行并删除其中一条。",
          ),
        );
      }
    }
    return issues;
  },
);

export const R007_DuplicateSiblingName = defineRule(
  {
    id: "R007",
    name: "同层级下名称重复",
    category: "uniqueness",
    severity: "warning",
    tables: TABLES,
    description:
      "同一父空间下的空间、同一空间下的设备、同一设备下的测点出现同名记录。不影响建模，但会让人工核对与选择产生歧义。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const table of TABLES) {
      const groupField = SIBLING_GROUP_FIELD[table];
      const firstSeen = new Map<string, number>();
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        const name = val(rec, "name");
        if (name === "") continue; // 空名称由 R001 负责
        const group = val(rec, groupField);
        const key = `${group}\u0000${name}`;
        const first = firstSeen.get(key);
        if (first === undefined) {
          firstSeen.set(key, rowNumber);
          continue;
        }
        const scopeText = group === "" ? "根层级" : `${fieldLabel(groupField)}「${group}」下`;
        issues.push(
          rowIssue(
            rule,
            table,
            rowNumber,
            rec,
            "name",
            `${scopeText}名称「${name}」与第 ${first} 行重复`,
            "为同层级的同名对象补充区分信息（如编号、方位），或确认是否为重复录入。",
          ),
        );
      }
    }
    return issues;
  },
);
