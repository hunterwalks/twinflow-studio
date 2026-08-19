import { TABLE_LABEL } from "@/lib/rules/types";
import type { ProjectState, TableKey } from "./types";

/** 一条跨表检索命中。 */
export interface SearchHit {
  /** 所在表（复数键）。 */
  table: TableKey;
  /** 表的中文标签。 */
  tableLabel: string;
  /** 记录在表中的 0-based 下标。 */
  rowIndex: number;
  /** 记录 ID（缺失时为空字符串）。 */
  recordId: string;
  /** 记录名称（缺失时退回命中字段值）。 */
  name: string;
  /** 命中字段（id / name）。 */
  matchedField: "id" | "name";
  /** 命中字段的原始值。 */
  matchedValue: string;
}

const TABLE_KEYS: TableKey[] = ["spaces", "assets", "sensors", "observations"];

const TABLE_KEY_TO_NAME: Record<TableKey, keyof typeof TABLE_LABEL> = {
  spaces: "space",
  assets: "asset",
  sensors: "sensor",
  observations: "observation",
};

const SEARCH_FIELDS = ["id", "name"] as const;

/**
 * 跨四表检索：对 id / name 做大小写不敏感的子串匹配。
 * 纯函数、确定性：同一输入必然得到同一命中列表（按表序 → 行序 → 字段序）。
 * 空查询返回空数组；每条记录最多命中一次（id 优先）。
 */
export function searchProject(state: ProjectState, query: string, limit = 50): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const table of TABLE_KEYS) {
    const rows = state[table];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const rec = rows[rowIndex];
      for (const field of SEARCH_FIELDS) {
        const v = rec[field];
        if (v == null) continue;
        const s = String(v);
        if (s.toLowerCase().includes(q)) {
          hits.push({
            table,
            tableLabel: TABLE_LABEL[TABLE_KEY_TO_NAME[table]],
            rowIndex,
            recordId: rec.id == null ? "" : String(rec.id),
            name: rec.name == null ? s : String(rec.name),
            matchedField: field,
            matchedValue: s,
          });
          break; // 每条记录只记一次命中
        }
      }
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}
