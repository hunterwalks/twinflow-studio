/**
 * 字段映射与导入校验（v0.2.0 起；v0.5.0 增加确定性映射建议）
 * 将源列映射到目标对象（Space / Asset / Sensor）的模型字段，
 * 并基于现有 Zod 模型做逐行校验，给出带行号的错误。
 *
 * v0.5.0 新增：在表头别名精确匹配之外，提供「置信度打分」的映射建议
 * （method: exact / normalized / fuzzy），自动接受高置信映射并对低置信项标记需复核。
 * 全部为纯函数、确定性、无外部 AI 依赖。
 */

import { AssetSchema, ObservationSchema, SensorSchema, SpaceSchema } from "../types";
import {
  TARGET_FIELDS,
  normalizeHeader,
  type ImportTargetType,
  type TargetField,
} from "./fieldTargets";
import { similarity } from "./similarity";
import type { z } from "zod";

/** source header -> target field key（null 表示未映射） */
export type Mapping = Record<string, string | null>;

const SCHEMA_BY_TARGET = {
  space: SpaceSchema,
  asset: AssetSchema,
  sensor: SensorSchema,
  observation: ObservationSchema,
} as const;

/** 映射匹配方式。 */
export type MappingMethod = "exact" | "normalized" | "fuzzy" | "none";

/** 单个候选源列及其置信度。 */
export interface MappingCandidate {
  source: string;
  score: number;
  method: MappingMethod;
}

/** 单个目标字段的映射建议。 */
export interface FieldMappingSuggestion {
  target: string;
  source: string | null;
  score: number;
  method: MappingMethod;
  required: boolean;
  /** 已自动映射但置信度低于高置信阈值，需要人工复核 */
  needsReview: boolean;
  /** Top-N 候选（含已选中的最佳源） */
  candidates: MappingCandidate[];
}

/** 一组目标类型的完整映射建议集合。 */
export interface MappingSuggestionSet {
  target: ImportTargetType;
  suggestions: FieldMappingSuggestion[];
  /** 自动应用的一对一映射（可直接用于 buildRecords） */
  mapping: Mapping;
  /** 高置信（>=0.85）字段数 */
  high: number;
  /** 中置信（0.6–0.85）字段数 */
  medium: number;
  /** 低置信（未自动映射）字段数 */
  low: number;
}

/** 自动接受阈值：相似度 >= 该值才自动映射。 */
export const AUTO_MIN_SCORE = 0.6;
/** 高置信阈值：>= 该值视为可信，无需复核。 */
export const HIGH_MIN_SCORE = 0.85;

/** 单个源表头对单个目标字段的匹配打分。 */
export function scoreHeaderAgainstField(
  header: string,
  field: TargetField,
): { score: number; method: MappingMethod } {
  const normHeader = normalizeHeader(header);
  const candidates = [
    normalizeHeader(field.key),
    ...field.aliases.map((a) => normalizeHeader(a)),
  ];
  if (candidates.includes(normHeader)) return { score: 1, method: "exact" };

  let best = 0;
  for (const c of candidates) best = Math.max(best, similarity(header, c));

  if (best >= HIGH_MIN_SCORE) return { score: best, method: "normalized" };
  if (best >= AUTO_MIN_SCORE) return { score: Math.round(best * 1000) / 1000, method: "fuzzy" };
  return { score: 0, method: "none" };
}

/**
 * 为某个目标类型生成完整映射建议。
 * 对每个目标字段取置信度最高的未占用源列；达到 AUTO_MIN_SCORE 才自动映射。
 */
export function suggestMappings(
  target: ImportTargetType,
  headers: string[],
): MappingSuggestionSet {
  const fields = TARGET_FIELDS[target];
  const used = new Set<string>();
  const suggestions: FieldMappingSuggestion[] = [];
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const f of fields) {
    const ranked = headers
      .filter((h) => !used.has(h))
      .map((h) => ({ source: h, ...scoreHeaderAgainstField(h, f) }))
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    const candidates: MappingCandidate[] = ranked
      .slice(0, 3)
      .map((r) => ({ source: r.source, score: r.score, method: r.method }));

    let source: string | null = null;
    let score = 0;
    let method: MappingMethod = "none";
    if (top && top.score >= AUTO_MIN_SCORE) {
      source = top.source;
      score = top.score;
      method = top.method;
      used.add(top.source);
    }

    const needsReview = source != null && score < HIGH_MIN_SCORE;
    if (source == null) low += 1;
    else if (score >= HIGH_MIN_SCORE) high += 1;
    else medium += 1;

    suggestions.push({
      target: f.key,
      source,
      score,
      method,
      required: f.required,
      needsReview,
      candidates,
    });
  }

  const mapping: Mapping = {};
  for (const s of suggestions) {
    if (s.source) mapping[s.source] = s.target;
  }
  for (const h of headers) if (!(h in mapping)) mapping[h] = null;

  return { target, suggestions, mapping, high, medium, low };
}

/** 基于表头与目标字段别名，生成智能默认映射（一对一）。v0.5.0 起由建议引擎驱动，保持原行为。 */
export function suggestMapping(headers: string[], target: ImportTargetType): Mapping {
  return suggestMappings(target, headers).mapping;
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
