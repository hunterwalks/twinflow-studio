import { describe, expect, it } from "vitest";
import { countObjects, loadDemoData } from "@/lib/loadDemo";
import { industrialPark } from "@/lib/data/industrialPark";
import { getDemoDataset } from "@/lib/data/registry";

describe("Demo 加载状态机", () => {
  it("默认返回 success 且携带默认（工业园区）数据集", () => {
    const r = loadDemoData();
    expect(r.status).toBe("success");
    if (r.status === "success") {
      // v0.7.0 起 demo 数据归一为 DemoDataset（宽松记录），按 key 校验更稳健。
      expect(r.data.key).toBe("industrial");
      expect(r.data.label).toContain("工业园区");
      expect(r.data.clean).toBe(true);
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

  it("countObjects 统计各类型数量（与源数据一致）", () => {
    const ds = getDemoDataset("industrial");
    const c = countObjects(ds);
    expect(c.spaces).toBe(industrialPark.spaces.length);
    expect(c.assets).toBe(industrialPark.assets.length);
    expect(c.sensors).toBe(industrialPark.sensors.length);
    expect(c.total).toBe(c.spaces + c.assets + c.sensors);
  });

  it("两套城市基础设施数据集均可被加载", () => {
    for (const key of ["city-clean", "city-problem"]) {
      const r = loadDemoData(key);
      expect(r.status).toBe("success");
      if (r.status === "success") {
        expect(r.data.key).toBe(key);
        expect(r.data.spaces.length).toBeGreaterThan(0);
      }
    }
  });
});
