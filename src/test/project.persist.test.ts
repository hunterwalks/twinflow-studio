import { beforeEach, describe, expect, it } from "vitest";
import { clearProject, loadProject, saveProject } from "@/lib/project/persist";
import type { ProjectState } from "@/lib/project/types";

class MemStorage {
  private store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
  clear(): void {
    this.store.clear();
  }
  key(i: number): string | null {
    return Array.from(this.store.keys())[i] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

const sample: ProjectState = {
  version: 2,
  source: "demo",
  spaces: [{ id: "SP-1", name: "园区", type: "park", parentId: "", description: "" }],
  assets: [],
  sensors: [],
  observations: [],
  updatedAt: "2026-08-13T00:00:00.000Z",
};

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage = new MemStorage() as unknown as Storage;
});

describe("项目持久化 persist", () => {
  it("保存后可原样读回（序列化往返）", () => {
    saveProject(sample);
    const loaded = loadProject();
    expect(loaded).not.toBeNull();
    expect(loaded?.source).toBe("demo");
    expect(loaded?.spaces).toEqual(sample.spaces);
    expect(loaded?.updatedAt).toBe(sample.updatedAt);
  });

  it("无存储键时返回 null", () => {
    expect(loadProject()).toBeNull();
  });

  it("损坏的 JSON 返回 null 而不抛错", () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage.setItem(
      "twinflow-project-v1",
      "{not-json",
    );
    expect(loadProject()).toBeNull();
  });

  it("版本不符返回 null", () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage.setItem(
      "twinflow-project-v1",
      JSON.stringify({ version: 99, source: "demo", spaces: [], assets: [], sensors: [], observations: [], updatedAt: "" }),
    );
    expect(loadProject()).toBeNull();
  });

  it("清除后读取返回 null", () => {
    saveProject(sample);
    expect(loadProject()).not.toBeNull();
    clearProject();
    expect(loadProject()).toBeNull();
  });

  it("脏数据缺字段时回退为空数组（不崩溃）", () => {
    (globalThis as unknown as { localStorage: Storage }).localStorage.setItem(
      "twinflow-project-v1",
      JSON.stringify({ version: 1, source: "import" }),
    );
    const loaded = loadProject();
    expect(loaded).not.toBeNull();
    expect(loaded?.spaces).toEqual([]);
    expect(loaded?.assets).toEqual([]);
    expect(loaded?.sensors).toEqual([]);
  });
});
