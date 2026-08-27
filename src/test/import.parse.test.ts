import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  detectFormat,
  importFileSizeError,
  MAX_IMPORT_FILE_BYTES,
  parseCsvText,
  parseFile,
  parseXlsxBuffer,
} from "@/lib/import/parse";

const CSV_SAMPLE =
  "ID,名称,类型,父级ID,描述\nS1,园区A,park,,根园区\nS2,建筑B,building,S1,主楼";

function buildXlsxBuffer(): ArrayBuffer {
  const wsSpace = XLSX.utils.aoa_to_sheet([
    ["ID", "名称", "类型", "父级ID", "描述"],
    ["S1", "园区A", "park", "", "根园区"],
  ]);
  const wsOther = XLSX.utils.aoa_to_sheet([
    ["ID", "名称"],
    ["X", "Y"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSpace, "Space");
  XLSX.utils.book_append_sheet(wb, wsOther, "Other");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  const bytes = out instanceof Uint8Array ? out : new Uint8Array(out as ArrayLike<number>);
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

describe("detectFormat", () => {
  it("识别 csv / xlsx / xls", () => {
    expect(detectFormat("a.csv")).toBe("csv");
    expect(detectFormat("a.XLSX")).toBe("xlsx");
    expect(detectFormat("a.xls")).toBe("xlsx");
  });
  it("未知格式返回 unknown", () => {
    expect(detectFormat("a.txt")).toBe("unknown");
    expect(detectFormat("a")).toBe("unknown");
  });
});

describe("importFileSizeError", () => {
  it("允许不超过 20 MiB 的文件", () => {
    expect(importFileSizeError(MAX_IMPORT_FILE_BYTES)).toBeNull();
  });

  it("拒绝超过 20 MiB 的文件并给出明确提示", () => {
    expect(importFileSizeError(MAX_IMPORT_FILE_BYTES + 1)).toMatch(/20 MiB/);
  });
});

describe("parseCsvText", () => {
  it("解析表头与数据行", () => {
    const sheet = parseCsvText(CSV_SAMPLE);
    expect(sheet.name).toBe("CSV");
    expect(sheet.headers).toEqual(["ID", "名称", "类型", "父级ID", "描述"]);
    expect(sheet.rows).toHaveLength(2);
    expect(sheet.rows[0]).toEqual({
      ID: "S1",
      名称: "园区A",
      类型: "park",
      父级ID: "",
      描述: "根园区",
    });
  });
});

describe("parseFile - CSV", () => {
  it("成功解析 csv 字符串", () => {
    const res = parseFile("demo.csv", CSV_SAMPLE);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.format).toBe("csv");
      expect(res.sheets).toHaveLength(1);
      expect(res.sheets[0].rows).toHaveLength(2);
    }
  });

  it("空 csv 给出明确错误", () => {
    const res = parseFile("empty.csv", "只是标题,没有数据");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("空");
  });
});

describe("parseFile - XLSX", () => {
  it("成功解析多工作表并保留表名", () => {
    const res = parseFile("book.xlsx", buildXlsxBuffer());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.format).toBe("xlsx");
      expect(res.sheets.map((s) => s.name)).toEqual(["Space", "Other"]);
      expect(res.sheets[0].rows).toHaveLength(1);
      expect(res.sheets[0].rows[0]["名称"]).toBe("园区A");
    }
  });
});

describe("parseXlsxBuffer", () => {
  it("返回按 SheetNames 顺序的工作表", () => {
    const sheets = parseXlsxBuffer(buildXlsxBuffer());
    expect(sheets.map((s) => s.name)).toEqual(["Space", "Other"]);
  });
});

describe("parseFile - 错误文件", () => {
  it("不支持的格式给出明确提示", () => {
    const res = parseFile("note.txt", "hello");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("不支持");
  });
  it("破损的 xlsx 被归一化为错误（不抛出）", () => {
    const broken = new TextEncoder().encode("not a real xlsx").buffer;
    const res = parseFile("broken.xlsx", broken);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(typeof res.error).toBe("string");
  });
});
