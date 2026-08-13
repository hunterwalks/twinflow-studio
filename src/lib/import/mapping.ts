/**
 * 字段映射与导入校验（v0.2.0）
 * 将源列映射到目标对象（Space / Asset / Sensor）的模型字段，
 * 并基于现有 Zod 模型做逐行校验，给出带行号的错误。
 */

import { AssetSchema, SensorSchema, SpaceSchema } from "../types";
import {
  TARGET_FIELDS,
  normalizeHeader,
  type ImportTargetType,
} from "./fieldTargets";
import type { z } from "zod";

/** source header -> target field key（null 表示未映射） */
export type Mapping = Record<string, string | null>;

const SCHEMA_BY_TARGET = {
  space: SpaceSchema,
  asset: AssetSchema,
  sensor: SensorSchema,
} as const;

/** 基于表头与目标字段别名，生成智能默认映射（一对一）。 */
export function suggestMapping(headers: string[], target: ImportTargetType): Mapping {
  const fields = TARGET_FIELDS[target];
  const mapping: Mapping = {};
  const consumed = new Set<string>();
  const normHeaders = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));

  for (const f of fields) {
    const candidates = [
      normalizeHeader(f.key),
      ...f.aliases.map((a) => normalizeHeader(a)),
    ];
    const hit = normHeaders.find(
      (h) => candidates.includes(h.norm) && !consumed.has(h.raw),
    );
    if (hit) {
      mapping[hit.raw] = f.key;
      consumed.add(hit.raw);
    }
  }

  for (const h of headers) {
    if (!(h in mapping)) mapping[h] = null;
  }
  return mapping;
}

/** 按当前映射，将原始数据行转换为目标记录（仅含已映射字段，值去空白）。 */
export function buildRecords(
  rows: Record<string, string>[],
  mapping: Mapping,
): Record<string, string>[] {
  const active = Object.entries(mapping).filter(
    (entry): entry is [string, string] => entry[1] != null,
  );
  return rows.map((row) => {
    const rec: Record<string, string> = {};
    for (const [src, tgt] of active) {
      const val = row[src];
      rec[tgt] = val == null ? "" : String(val).trim();
    }
    return rec;
  });
}

export interface ImportError {
  /** 数据行号（从 1 开始，不含表头） */
  row: number;
  message: string;
}

export interface ImportOutcome {
  valid: Record<string, string>[];
  errors: ImportError[];
}

/** 将 Zod issue 翻译为中文可读信息。 */
function issueToMessage(
  issue: z.ZodIssue,
  fields: { key: string; label: string }[],
): string {
  const label =
    issue.path.length > 0
      ? fields.find((f) => f.key === String(issue.path[0]))?.label ?? String(issue.path[0])
      : "记录";
  switch (issue.code) {
    case "too_small":
      return `${label}不能为空`;
    case "invalid_type":
      return `${label}类型不正确`;
    case "invalid_enum_value":
      return `${label}取值不在允许范围`;
    default:
      return issue.message ? `${label}：${issue.message}` : `${label}校验未通过`;
  }
}

/** 对映射后的记录逐行校验，返回通过记录与带行号的错误。 */
export function validateImport(
  records: Record<string, string>[],
  target: ImportTargetType,
): ImportOutcome {
  const schema = SCHEMA_BY_TARGET[target];
  const fields = TARGET_FIELDS[target];
  const valid: Record<string, string>[] = [];
  const errors: ImportError[] = [];

  records.forEach((rec, i) => {
    // 可空字段的空字符串视作「无值」→ null（与 v0.1.0 模型 .nullable() 一致，不改变必填校验）
    const normalized: Record<string, string | null> = { ...rec };
    for (const f of fields) {
      if (f.nullable && normalized[f.key] === "") normalized[f.key] = null;
    }
    const parsed = schema.safeParse(normalized);
    if (parsed.success) {
      valid.push(normalized as Record<string, string>);
    } else {
      const first = parsed.error.issues[0];
      errors.push({
        row: i + 1,
        message: first ? issueToMessage(first, fields) : "校验未通过",
      });
    }
  });

  return { valid, errors };
}
