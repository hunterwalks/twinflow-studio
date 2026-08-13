/**
 * 引用完整性类规则：R008 引用对象不存在 / R009 空间父级自引用
 *
 * 假阳性防护：R008 仅在被引用表**有数据**时才检查该条引用关系。
 * 例如只导入了设备表、尚未导入空间表时，不会把全部 spaceId 判为悬空引用。
 */

import { indexed, rowIssue, tableRecords, val } from "../dataset";
import { defineRule } from "../define";
import { REFERENCE_SPECS, fieldLabel } from "../spec";
import { TABLE_LABEL, type Issue, type TableName } from "../types";

export const R008_DanglingReference = defineRule(
  {
    id: "R008",
    name: "引用对象不存在",
    category: "reference",
    severity: "error",
    tables: ["space", "asset", "sensor"],
    description:
      "space.parentId / asset.spaceId / sensor.assetId 指向的对象在对应表中不存在，即悬空引用。会直接导致层级断裂、设备挂载失败。",
    skipReason: (ctx) => {
      const relations = REFERENCE_SPECS.filter((spec) => ctx.hasTable[spec.table]);
      if (relations.length === 0) return "三张表均为空，没有可校验的引用关系";
      const checkable = relations.filter((spec) => ctx.hasTable[spec.target]);
      if (checkable.length > 0) return null;
      const missing: TableName[] = [...new Set(relations.map((spec) => spec.target))];
      const names = missing.map((t) => TABLE_LABEL[t]).join("、");
      return `${names}表为空，无法判定引用是否有效，已跳过以避免误报`;
    },
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const spec of REFERENCE_SPECS) {
      if (!ctx.hasTable[spec.table]) continue;
      // 被引用表为空时跳过该条引用关系，避免整表误报
      if (!ctx.hasTable[spec.target]) continue;
      const known = ctx.idSet[spec.target];
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, spec.table))) {
        const ref = val(rec, spec.field);
        if (ref === "") continue; // 空值由 R001（必填）或视作根节点处理
        if (known.has(ref)) continue;
        issues.push(
          rowIssue(
            rule,
            spec.table,
            rowNumber,
            rec,
            spec.field,
            `${fieldLabel(spec.field)}「${ref}」在${TABLE_LABEL[spec.target]}表中不存在`,
            `确认被引用对象是否漏导入，或修正该行的${fieldLabel(spec.field)}。`,
          ),
        );
      }
    }
    return issues;
  },
);

export const R009_SelfParentReference = defineRule(
  {
    id: "R009",
    name: "空间父级自引用",
    category: "reference",
    severity: "error",
    tables: ["space"],
    description:
      "空间的父级 ID 指向自身，形成长度为 1 的自环。会让层级遍历陷入死循环或直接失败。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, "space"))) {
      const id = val(rec, "id");
      const parentId = val(rec, "parentId");
      if (id === "" || parentId === "") continue;
      if (id !== parentId) continue;
      issues.push(
        rowIssue(
          rule,
          "space",
          rowNumber,
          rec,
          "parentId",
          `父级ID 指向自身「${id}」`,
          "将父级ID 改为真实上级空间；若该空间就是根节点，请把父级ID 留空。",
        ),
      );
    }
    return issues;
  },
);
