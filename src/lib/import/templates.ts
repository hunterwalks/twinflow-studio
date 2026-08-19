/**
 * 导入映射模板复用（v0.8.0）
 *
 * 将「目标类型 + 字段映射」保存为命名模板，下次导入同结构文件时一键复用。
 * 模板持久化在 localStorage（key: twinflow-mapping-templates），纯本地、不上传。
 *
 * 设计要点：
 * - 模板按目标类型（space / asset / sensor / observation）分别保存。
 * - 应用模板时只保留当前文件实际存在的源列，其余置为未映射，避免列名漂移导致误映射。
 * - 全部为纯函数 + 安全降级（隐私模式 / 配额不足时静默返回空）。
 */

import type { ImportTargetType } from "./fieldTargets";
import type { Mapping } from "./mapping";

const STORAGE_KEY = "twinflow-mapping-templates";

export interface MappingTemplate {
  id: string;
  name: string;
  target: ImportTargetType;
  mapping: Mapping;
  createdAt: string;
}

function storage(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
      return (globalThis as { localStorage: Storage }).localStorage;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function newId(): string {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { crypto?: Crypto }).crypto?.randomUUID) {
      return (globalThis as { crypto: Crypto }).crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 读取全部模板（解析失败或结构异常时返回空数组）。 */
export function loadTemplates(): MappingTemplate[] {
  const s = storage();
  if (!s) return [];
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is MappingTemplate =>
        !!t &&
        typeof t.id === "string" &&
        typeof t.name === "string" &&
        typeof t.target === "string" &&
        !!t.mapping &&
        typeof t.mapping === "object",
    );
  } catch {
    return [];
  }
}

function persist(templates: MappingTemplate[]): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    /* 静默降级 */
  }
}

/** 保存一个映射模板（追加）。返回创建后的模板对象。 */
export function saveTemplate(
  name: string,
  target: ImportTargetType,
  mapping: Mapping,
): MappingTemplate {
  const tpl: MappingTemplate = {
    id: newId(),
    name: name.trim() || `模板 ${new Date().toISOString().slice(0, 10)}`,
    target,
    mapping,
    createdAt: new Date().toISOString(),
  };
  const all = loadTemplates();
  all.push(tpl);
  persist(all);
  return tpl;
}

/** 删除指定模板。 */
export function deleteTemplate(id: string): void {
  persist(loadTemplates().filter((t) => t.id !== id));
}

/**
 * 将模板应用到当前工作表：仅保留当前文件确实存在的源列映射，其余置为未映射。
 * 这样列名在不同文件中略有差异时不会误映射，缺失的列自然落空。
 */
export function applyTemplate(template: MappingTemplate, headers: string[]): Mapping {
  const next: Mapping = {};
  for (const h of headers) {
    const tgt = template.mapping[h];
    next[h] = tgt != null ? tgt : null;
  }
  return next;
}
