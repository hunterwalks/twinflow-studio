import { describe, it, expect } from "vitest";
import { buildReport } from "@/lib/report/build";
import { toJSON, toHTML } from "@/lib/report/exporters";
import { makeDataset } from "@/lib/rules/dataset";
import { APP_VERSION } from "@/lib/version";

const SAME_TIME = "2026-08-14T00:00:00.000Z";

const FULL = makeDataset({
  spaces: [{ id: "SP-1", name: "园区", type: "园区", parentId: "", description: "d" }],
  assets: [{ id: "AS-1", name: "泵", type: "设备", spaceId: "SP-1", description: "d" }],
  sensors: [{ id: "SE-1", name: "温度", assetId: "AS-1", quantity: "温度", unit: "℃", description: "d" }],
});

describe("toJSON", () => {
  it("往返：解析后结构与分值一致", () => {
    const rep = buildReport({ dataset: FULL, generatedAt: SAME_TIME });
    const back = JSON.parse(toJSON(rep)) as typeof rep;
    expect(back.meta.version).toBe(APP_VERSION);
    expect(back.quality.score).toBe(rep.quality.score);
    expect(back.validation.totals.all).toBe(rep.validation.totals.all);
    expect(back.recommendations.length).toBe(rep.recommendations.length);
  });
});

describe("toHTML", () => {
  it("包含关键区块与元信息", () => {
    const rep = buildReport({ dataset: FULL, source: "内置 Demo 数据", generatedAt: SAME_TIME });
    const html = toHTML(rep);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("TwinFlow Studio 数据质量治理报告");
    expect(html).toContain(rep.meta.generatedAt);
    expect(html).toContain("问题清单");
    expect(html).toContain("规则与治理建议");
    expect(html).toContain(`等级 ${rep.quality.grade}`);
  });

  it("对含 HTML 特殊字符的数据做转义，避免注入", () => {
    const ds = makeDataset({
      spaces: [
        { id: "<img src=x onerror=alert(1)>", name: "A", type: "园区", parentId: "", description: "" },
        { id: "<img src=x onerror=alert(1)>", name: "B", type: "园区", parentId: "", description: "" },
      ],
    });
    const rep = buildReport({ dataset: ds, generatedAt: SAME_TIME });
    const html = toHTML(rep);
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x onerror=alert(1)>");
  });
});
