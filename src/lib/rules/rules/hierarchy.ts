/**
 * 层级类规则：R010 空间层级存在环 / R011 空间层级顺序倒置 / R012 缺少根空间
 */

import { indexed, rowIssue, tableIssue, tableRecords, val } from "../dataset";
import { defineRule } from "../define";
import { SPACE_TYPE_LEVEL } from "../spec";
import type { Issue, LooseRecord } from "../types";

/** 按 ID 建立空间索引（同 ID 取首次出现，重复由 R006 负责）。 */
function indexSpacesById(spaces: LooseRecord[]): Map<string, LooseRecord> {
  const map = new Map<string, LooseRecord>();
  for (const rec of spaces) {
    const id = val(rec, "id");
    if (id === "" || map.has(id)) continue;
    map.set(id, rec);
  }
  return map;
}

export const R010_HierarchyCycle = defineRule(
  {
    id: "R010",
    name: "空间层级存在环",
    category: "hierarchy",
    severity: "error",
    tables: ["space"],
    description:
      "沿父级 ID 向上追溯时回到了起点，说明空间层级构成闭环。会导致树形结构无法生成、遍历死循环。",
    skipReason: (ctx) => (ctx.hasTable.space ? null : "空间表为空，无层级可校验"),
  },
  (ctx, rule) => {
    const spaces = tableRecords(ctx.dataset, "space");
    const byId = indexSpacesById(spaces);
    const issues: Issue[] = [];
    const limit = spaces.length + 1;

    for (const { rec, rowNumber } of indexed(spaces)) {
      const startId = val(rec, "id");
      if (startId === "") continue;

      const chain: string[] = [startId];
      let cursor = val(rec, "parentId");
      let steps = 0;
      let cycleAt: string | null = null;

      while (cursor !== "" && steps < limit) {
        if (chain.includes(cursor)) {
          cycleAt = cursor;
          break;
        }
        chain.push(cursor);
        const parent = byId.get(cursor);
        if (!parent) break; // 悬空引用由 R008 负责
        cursor = val(parent, "parentId");
        steps += 1;
      }

      if (cycleAt === null) continue;
      // 自环由 R009 单独报告，避免同一问题重复两条
      if (cycleAt === startId && chain.length === 1) continue;

      const path = [...chain.slice(chain.indexOf(cycleAt)), cycleAt].join(" → ");
      issues.push(
        rowIssue(
          rule,
          "space",
          rowNumber,
          rec,
          "parentId",
          `空间层级构成闭环：${path}`,
          "断开环中任意一处父子关系，确保层级是一棵树（每个空间只有一个上级、且不回指下级）。",
        ),
      );
    }
    return issues;
  },
);

export const R011_HierarchyOrderInverted = defineRule(
  {
    id: "R011",
    name: "空间层级顺序倒置",
    category: "hierarchy",
    severity: "warning",
    tables: ["space"],
    description:
      "父子空间的类型层级不符合「园区 → 建筑 → 楼层 → 区域」的自上而下顺序，例如把楼层挂在区域下。层级仍可生成，但语义不合理。",
    skipReason: (ctx) => (ctx.hasTable.space ? null : "空间表为空，无层级可校验"),
  },
  (ctx, rule) => {
    const spaces = tableRecords(ctx.dataset, "space");
    const byId = indexSpacesById(spaces);
    const issues: Issue[] = [];

    for (const { rec, rowNumber } of indexed(spaces)) {
      const parentId = val(rec, "parentId");
      if (parentId === "") continue;
      if (parentId === val(rec, "id")) continue; // 自引用由 R009 负责，避免同一问题重复报告
      const parent = byId.get(parentId);
      if (!parent) continue; // 悬空引用由 R008 负责

      const childType = val(rec, "type");
      const parentType = val(parent, "type");
      const childLevel = SPACE_TYPE_LEVEL[childType];
      const parentLevel = SPACE_TYPE_LEVEL[parentType];
      // 类型非法由 R013 负责，此处只在两端类型均合法时判定
      if (childLevel === undefined || parentLevel === undefined) continue;
      if (childLevel > parentLevel) continue;

      const relation = childLevel === parentLevel ? "与父级同级" : "高于父级";
      issues.push(
        rowIssue(
          rule,
          "space",
          rowNumber,
          rec,
          "type",
          `类型「${childType}」${relation}（父级「${parentId}」为「${parentType}」），不符合园区→建筑→楼层→区域的顺序`,
          "调整该空间的类型，或把它挂到层级更高的父空间下。",
        ),
      );
    }
    return issues;
  },
);

export const R012_MissingRootSpace = defineRule(
  {
    id: "R012",
    name: "缺少根空间",
    category: "hierarchy",
    severity: "error",
    tables: ["space"],
    description:
      "空间表中没有任何父级为空的记录，说明缺少层级入口。整棵空间树将无法确定起点。",
    skipReason: (ctx) => (ctx.hasTable.space ? null : "空间表为空，无层级可校验"),
  },
  (ctx, rule) => {
    const spaces = tableRecords(ctx.dataset, "space");
    const hasRoot = spaces.some((rec) => val(rec, "parentId") === "");
    if (hasRoot) return [];
    return [
      tableIssue(
        rule,
        "space",
        `空间表共 ${spaces.length} 条记录，但没有任何记录的父级ID 为空`,
        "把最顶层空间（通常是园区）的父级ID 留空，作为整棵层级树的根节点。",
      ),
    ];
  },
);
