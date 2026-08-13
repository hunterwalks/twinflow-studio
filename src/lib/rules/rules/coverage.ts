/**
 * 覆盖度类规则：R014 设备未挂载任何测点
 */

import { indexed, rowIssue, tableRecords, val } from "../dataset";
import { defineRule } from "../define";
import type { Issue } from "../types";

export const R014_AssetWithoutSensor = defineRule(
  {
    id: "R014",
    name: "设备未挂载任何测点",
    category: "coverage",
    severity: "info",
    tables: ["asset"],
    description:
      "设备没有被任何测点引用，意味着该设备在孪生场景中没有可监测的数据。可能是点表漏梳理，也可能该设备本身确实不需要监测。",
    skipReason: (ctx) => {
      if (!ctx.hasTable.asset) return "设备表为空，无覆盖度可校验";
      if (!ctx.hasTable.sensor) return "测点表为空，无法判定设备是否有测点，已跳过以避免误报";
      return null;
    },
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, "asset"))) {
      const id = val(rec, "id");
      if (id === "") continue; // 空 ID 由 R001 负责
      if ((ctx.sensorCountByAsset.get(id) ?? 0) > 0) continue;
      issues.push(
        rowIssue(
          rule,
          "asset",
          rowNumber,
          rec,
          "id",
          `设备「${id}」没有任何测点引用它`,
          "补充该设备的测点，或确认该设备在本期范围内不需要监测。",
        ),
      );
    }
    return issues;
  },
);
