import { describe, expect, it } from "vitest";
import { visibleRange } from "@/lib/table";

describe("visibleRange 虚拟滚动区间", () => {
  it("顶部位置：从第 0 行开始，含上下 overscan", () => {
    const r = visibleRange({ total: 1000, scrollTop: 0, viewportHeight: 400, rowHeight: 40, overscan: 5 });
    expect(r.start).toBe(0);
    expect(r.end).toBeGreaterThan(0);
    expect(r.end).toBeLessThanOrEqual(10 + 10); // ceil(400/40)+5*2 = 10+10
    expect(r.offsetY).toBe(0);
    expect(r.totalHeight).toBe(1000 * 40);
  });

  it("滚动到中部：start 按 scrollTop/rowHeight 推导并扣除 overscan", () => {
    const r = visibleRange({ total: 1000, scrollTop: 4000, viewportHeight: 400, rowHeight: 40, overscan: 5 });
    expect(r.start).toBe(95); // 4000/40 - 5
    expect(r.offsetY).toBe(95 * 40);
  });

  it("滚动到底部：end 收敛到 total，start 不小于 0", () => {
    const r = visibleRange({ total: 1000, scrollTop: 100000, viewportHeight: 400, rowHeight: 40, overscan: 5 });
    expect(r.end).toBe(1000);
    expect(r.start).toBeLessThan(1000);
    expect(r.start).toBeGreaterThanOrEqual(0);
  });

  it("空数据 / 非法行高返回空区间", () => {
    expect(visibleRange({ total: 0, scrollTop: 0, viewportHeight: 400, rowHeight: 40 })).toEqual({
      start: 0,
      end: 0,
      offsetY: 0,
      totalHeight: 0,
    });
    expect(visibleRange({ total: 10, scrollTop: 0, viewportHeight: 400, rowHeight: 0 })).toEqual({
      start: 0,
      end: 0,
      offsetY: 0,
      totalHeight: 0,
    });
  });

  it("overscan 缺省为 6，区间覆盖视口所需行数", () => {
    const r = visibleRange({ total: 500, scrollTop: 200, viewportHeight: 300, rowHeight: 30 });
    const needed = Math.ceil(300 / 30) + 12; // 10 + 12
    expect(r.end - r.start).toBeLessThanOrEqual(needed);
    expect(r.start).toBe(0); // 200/30 - 6 = 0.67 → 0
  });
});
