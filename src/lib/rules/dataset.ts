/**
 * 宽松数据集构建与字段读取辅助（v0.3.0）
 */

import type { IndustrialPark } from "../types";
import type {
  Issue,
  LooseRecord,
  Rule,
  RuleContext,
  RuleDataset,
  TableName,
} from "./types";

/** 空数据集。 */
export function emptyDataset(): RuleDataset {
  return { spaces: [], assets: [], sensors: [] };
}

/** 由部分表构造数据集（未给出的表为空）。 */
export function makeDataset(partial: Partial<RuleDataset>): RuleDataset {
  return {
    spaces: partial.spaces ?? [],
    assets: partial.assets ?? [],
    sensors: partial.sensors ?? [],
  };
}

/**
 * 将已通过 Zod 的 IndustrialPark 转为宽松数据集。
 * parentId 为 null 时转为空字符串，语义仍是「无父级」。
 */
export function toRuleDataset(park: IndustrialPark): RuleDataset {
  return {
    spaces: park.spaces.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      parentId: s.parentId ?? "",
      description: s.description,
    })),
    assets: park.assets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      spaceId: a.spaceId,
      description: a.description,
    })),
    sensors: park.sensors.map((s) => ({
      id: s.id,
      name: s.name,
      assetId: s.assetId,
      quantity: s.quantity,
      unit: s.unit,
      description: s.description,
    })),
  };
}

/** 读取字段原始值（保留首尾空白），缺失返回空字符串。 */
export function raw(rec: LooseRecord, field: string): string {
  const v = rec[field];
  return v == null ? "" : String(v);
}

/** 读取字段值并去除首尾空白。 */
export function val(rec: LooseRecord, field: string): string {
  return raw(rec, field).trim();
}

/** 记录的表格行数据（用于遍历时同时拿到行号）。 */
export interface IndexedRecord {
  rec: LooseRecord;
  /** 从 1 开始的行号 */
  rowNumber: number;
}

/** 按行号包装记录数组。 */
export function indexed(records: LooseRecord[]): IndexedRecord[] {
  return records.map((rec, i) => ({ rec, rowNumber: i + 1 }));
}

/** 取三张表的记录数组。 */
export function tableRecords(ds: RuleDataset, table: TableName): LooseRecord[] {
  if (table === "space") return ds.spaces;
  if (table === "asset") return ds.assets;
  return ds.sensors;
}

/** 构建规则执行上下文（预建索引）。 */
export function buildContext(dataset: RuleDataset): RuleContext {
  const idSet: Record<TableName, Set<string>> = {
    space: new Set(dataset.spaces.map((r) => val(r, "id")).filter((v) => v !== "")),
    asset: new Set(dataset.assets.map((r) => val(r, "id")).filter((v) => v !== "")),
    sensor: new Set(dataset.sensors.map((r) => val(r, "id")).filter((v) => v !== "")),
  };

  const sensorCountByAsset = new Map<string, number>();
  for (const s of dataset.sensors) {
    const key = val(s, "assetId");
    if (key === "") continue;
    sensorCountByAsset.set(key, (sensorCountByAsset.get(key) ?? 0) + 1);
  }

  return {
    dataset,
    hasTable: {
      space: dataset.spaces.length > 0,
      asset: dataset.assets.length > 0,
      sensor: dataset.sensors.length > 0,
    },
    idSet,
    sensorCountByAsset,
  };
}

/** 构造行级问题（自动填入行号、记录 ID 与规则元信息）。 */
export function rowIssue(
  rule: Rule,
  table: TableName,
  rowNumber: number,
  rec: LooseRecord,
  field: string | null,
  message: string,
  hint: string,
  severity?: Issue["severity"],
): Issue {
  const id = val(rec, "id");
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    category: rule.category,
    severity: severity ?? rule.severity,
    table,
    scope: "row",
    rowNumber,
    recordId: id === "" ? null : id,
    field,
    message,
    hint,
  };
}

/** 构造整表级问题。 */
export function tableIssue(
  rule: Rule,
  table: TableName,
  message: string,
  hint: string,
): Issue {
  return {
    ruleId: rule.id,
    ruleName: rule.name,
    category: rule.category,
    severity: rule.severity,
    table,
    scope: "table",
    rowNumber: null,
    recordId: null,
    field: null,
    message,
    hint,
  };
}
