/**
 * 问题修复预览引擎（v0.9.0）
 *
 * 为「可确定性修复」的校验问题生成修复建议（before → after），并在用户确认后
 * 应用到项目状态。所有修复均为纯函数、确定性，且只改目标记录的单个字段，
 * 不影响原始导入源与其它记录。
 *
 * 仅对下列规则提供自动修复；其余（引用缺失、必填缺失、重复、层级环等）
 * 无法在本地安全推断目标值，一律返回 null，交由用户手动处理。
 *   - R003 字段首尾空白        → 去空白
 *   - R004 名称过长            → 截断至 NAME_MAX_LENGTH
 *   - R009 空间父级自引用      → 解除自引用，置为根节点
 *   - R015 / R020 单位与量纲不匹配 → 归一为量纲的标准单位
 */

import { NAME_MAX_LENGTH, UNITS_BY_QUANTITY, knownQuantity, unitMatches } from "@/lib/rules/spec";
import type { Issue, LooseRecord, TableName } from "@/lib/rules/types";
import type { ProjectState, TableKey } from "@/lib/project/types";

/** 一条确定性修复建议。 */
export interface ProposedFix {
  /** 目标表（复数键，与 ProjectState 一致）。 */
  table: TableKey;
  /** 目标记录在表中的 0-based 下标。 */
  rowIndex: number;
  /** 需要修改的字段。 */
  field: string;
  /** 修改前的值（用于应用前校验未被并发改动）。 */
  current: string;
  /** 建议值。 */
  proposed: string;
  /** 人类可读的修复说明。 */
  description: string;
}

const PLURAL: Record<TableName, TableKey> = {
  space: "spaces",
  asset: "assets",
  sensor: "sensors",
  observation: "observations",
};

function recordAt(state: ProjectState, table: TableName, rowNumber: number | null): LooseRecord | null {
  if (rowNumber == null) return null;
  const arr = state[PLURAL[table]];
  return arr[rowNumber - 1] ?? null;
}

function asStr(v: unknown): string {
  return v == null ? "" : String(v);
}

/**
 * 基于单条 Issue 与当前项目状态，生成确定性修复建议；不可自动修复返回 null。
 * 纯函数：相同输入必然得到相同建议。
 */
export function proposeFix(issue: Issue, state: ProjectState): ProposedFix | null {
  const rec = recordAt(state, issue.table, issue.rowNumber);
  if (!rec) return null;
  const field = issue.field;
  if (!field) return null;
  const current = asStr(rec[field]);
  const rowIndex = (issue.rowNumber as number) - 1;
  const table = PLURAL[issue.table];

  switch (issue.ruleId) {
    case "R003": {
      if (current === current.trim()) return null;
      return {
        table,
        rowIndex,
        field,
        current,
        proposed: current.trim(),
        description: "去除字段首尾空白。",
      };
    }
    case "R004": {
      if (current.length <= NAME_MAX_LENGTH) return null;
      return {
        table,
        rowIndex,
        field,
        current,
        proposed: current.slice(0, NAME_MAX_LENGTH),
        description: `截断名称至 ${NAME_MAX_LENGTH} 个字符。`,
      };
    }
    case "R009": {
      if (current === "") return null;
      return {
        table,
        rowIndex,
        field,
        current,
        proposed: "",
        description: "解除父级自引用，将该空间置为根节点。",
      };
    }
    case "R015":
    case "R020": {
      const quantity = asStr(rec["quantity"]);
      if (!knownQuantity(quantity)) return null;
      const allowed = UNITS_BY_QUANTITY[quantity];
      if (!allowed || allowed.length === 0) return null;
      if (unitMatches(quantity, current)) return null;
      return {
        table,
        rowIndex,
        field,
        current,
        proposed: allowed[0],
        description: `将单位归一为「${allowed[0]}」（量纲「${quantity}」的标准单位）。`,
      };
    }
    default:
      return null;
  }
}

/**
 * 将修复应用到项目状态，返回新的不可变状态。
 * 仅当目标记录存在且当前字段值仍为 `fix.current` 时才修改，
 * 否则视为已被用户其它编辑改动，放弃应用以避免覆盖。
 */
export function applyFix(state: ProjectState, fix: ProposedFix): ProjectState {
  const arr = state[fix.table];
  const target = arr[fix.rowIndex];
  if (!target) return state;
  if (asStr(target[fix.field]) !== fix.current) return state;
  const next = arr.map((r, i) =>
    i === fix.rowIndex ? { ...r, [fix.field]: fix.proposed } : r,
  );
  return {
    ...state,
    [fix.table]: next,
    updatedAt: new Date().toISOString(),
  };
}
