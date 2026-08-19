import { beforeEach, describe, expect, it } from "vitest";
import {
  applyTemplate,
  deleteTemplate,
  loadTemplates,
  saveTemplate,
  type MappingTemplate,
} from "@/lib/import/templates";

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
  key(i: number): string | null {
    return Array.from(this.m.keys())[i] ?? null;
  }
  get length(): number {
    return this.m.size;
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage =
    new MemStorage() as unknown as Storage;
});

describe("导入映射模板复用（v0.8.0）", () => {
  it("保存后可载入，且包含目标类型与映射", () => {
    saveTemplate("空间模板", "space", {
      编号: "id",
      名称: "name",
      类型: "type",
    });
    const all = loadTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("空间模板");
    expect(all[0].target).toBe("space");
    expect(all[0].mapping["编号"]).toBe("id");
  });

  it("空名称回退为默认命名", () => {
    const tpl = saveTemplate("   ", "asset", {});
    expect(tpl.name).toMatch(/模板/);
  });

  it("应用模板仅保留当前文件实际存在的列", () => {
    const tpl: MappingTemplate = {
      id: "t1",
      name: "t",
      target: "space",
      mapping: { 编号: "id", 废弃列: "x" },
      createdAt: "",
    };
    const next = applyTemplate(tpl, ["编号", "名称"]);
    expect(next["编号"]).toBe("id");
    expect(next["名称"]).toBeNull();
    expect(next["废弃列"]).toBeUndefined();
  });

  it("删除模板后不再出现", () => {
    const t = saveTemplate("待删", "sensor", {});
    deleteTemplate(t.id);
    expect(loadTemplates().find((x) => x.id === t.id)).toBeUndefined();
  });
});
