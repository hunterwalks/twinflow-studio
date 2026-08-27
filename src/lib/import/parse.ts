/**
 * 文件解析（v0.2.0）
 * 浏览器端解析 CSV / XLSX，不落盘、不联网。
 * 解析函数接受字符串 / ArrayBuffer，便于在 Node（Vitest）中直接测试。
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

/** 浏览器内解析文件的上限，避免大文件耗尽内存或长时间阻塞主线程。 */
export const MAX_IMPORT_FILE_BYTES = 20 * 1024 * 1024;

/** 超过文件上限时返回用户可读错误，否则返回 null。 */
export function importFileSizeError(size: number): string | null {
  if (size <= MAX_IMPORT_FILE_BYTES) return null;
  return "文件超过 20 MiB 上限。请拆分工作簿或精简数据后重试。";
}

export interface ParsedSheet {
  /** 工作表名（CSV 固定为 "CSV"） */
  name: string;
  /** 列头，按出现顺序 */
  headers: string[];
  /** 数据行（不含表头），字段以列头为键、值为字符串 */
  rows: Record<string, string>[];
}

export type ParseSuccess = {
  ok: true;
  format: "csv" | "xlsx";
  sheets: ParsedSheet[];
};

export type ParseFailure = {
  ok: false;
  error: string;
};

export type ParseResult = ParseSuccess | ParseFailure;

/** 由文件名推断格式；无法识别返回 unknown。 */
export function detectFormat(filename: string): "csv" | "xlsx" | "unknown" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "xlsx";
  return "unknown";
}

function cleanRow(raw: Record<string, unknown>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) {
    if (k === "") continue;
    cleaned[String(k)] = v == null ? "" : String(v);
  }
  return cleaned;
}

function toSheet(name: string, rows: Record<string, string>[]): ParsedSheet {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { name, headers, rows };
}

/** 解析 CSV 文本为单工作表。 */
export function parseCsvText(text: string): ParsedSheet {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const rows = (result.data ?? []).map((r) => cleanRow(r ?? {}));
  return toSheet("CSV", rows);
}

/** 解析 XLSX 缓冲区为多个工作表（按 SheetNames 顺序）。 */
export function parseXlsxBuffer(buffer: ArrayBuffer): ParsedSheet[] {
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
  return wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });
    const rows = raw.map((r) => cleanRow(r ?? {}));
    return toSheet(name, rows);
  });
}

/**
 * 统一解析入口。
 * @param filename 用于推断格式
 * @param content CSV 传字符串，XLSX 传 ArrayBuffer
 */
export function parseFile(filename: string, content: ArrayBuffer | string): ParseResult {
  const format = detectFormat(filename);
  if (format === "unknown") {
    return {
      ok: false,
      error: `不支持的文件格式：${filename}。仅支持 .csv 与 .xlsx / .xls。`,
    };
  }
  try {
    if (format === "csv") {
      const text = typeof content === "string" ? content : new TextDecoder("utf-8").decode(content);
      const sheet = parseCsvText(text);
      if (sheet.rows.length === 0) {
        return { ok: false, error: "文件为空或没有可解析的数据行。" };
      }
      return { ok: true, format, sheets: [sheet] };
    }
    const buffer =
      typeof content === "string" ? new TextEncoder().encode(content).buffer : content;
    const sheets = parseXlsxBuffer(buffer);
    if (sheets.length === 0 || sheets.every((s) => s.rows.length === 0)) {
      return { ok: false, error: "文件为空或没有可解析的数据行。" };
    }
    return { ok: true, format, sheets };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `解析失败：${msg}` };
  }
}
