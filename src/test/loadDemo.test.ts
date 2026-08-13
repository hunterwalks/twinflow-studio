import { describe, expect, it } from "vitest";
import { countObjects, loadDemoData } from "@/lib/loadDemo";
import { industrialPark } from "@/lib/data/industrialPark";

describe("Demo 加载状态机", () => {
  it("默认返回 success 且携带合成数据", () => {
    const r = loadDemoData();
    expect(r.status).toBe("success");
    if (r.status === "success") {
      expect(r.data).toBe(industrialPark);
    }
  });

  it("view=empty 返回空状态", () => {
    expect(loadDemoData("empty")).toEqual({ status: "empty" });
  });

  it("view=error 返回错误状态与消息", () => {
    const r = loadDemoData("error");
    expect(r.status).toBe("error");
    if (r.status === "error") {
      expect(typeof r.message).toBe("string");
      expect(r.message.length).toBeGreaterThan(0);
    }
  });

  it("数组形式的 view 参数取第一个值", () => {
    expect(loadDemoData(["empty"])).toEqual({ status: "empty" });
  });

  it("countObjects 统计各类型数量", () => {
    const c = countObjects(industrialPark);
    expect(c.spaces).toBe(industrialPark.spaces.length);
    expect(c.assets).toBe(industrialPark.assets.length);
    expect(c.sensors).toBe(industrialPark.sensors.length);
    expect(c.total).toBe(c.spaces + c.assets + c.sensors);
  });
});
