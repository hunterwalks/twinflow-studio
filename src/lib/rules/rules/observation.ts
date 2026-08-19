/**
 * 观测类规则（v0.8.0）
 * Observation 为 Sensor 产生的观测读数，规则聚焦跨表引用、时间合法、数值可解析与去重。
 * 复用既有 6 个类别（reference / convention / completeness / uniqueness），
 * 质量评分与报告无需改结构即可纳入。
 */

import { indexed, rowIssue, val } from "../dataset";
import { defineRule } from "../define";
import type { Issue } from "../types";

/** 构造 (sensorId, timestamp) 组合键，空值不参与重复判定。 */
function observationKey(rec: Record<string, string | null | undefined>): string | null {
  const sid = val(rec, "sensorId");
  const ts = val(rec, "timestamp");
  if (sid === "" || ts === "") return null;
  return `${sid} ${ts}`;
}

export const R016_ObservationSensorReference = defineRule(
  {
    id: "R016",
    name: "观测引用传感器必须存在",
    category: "reference",
    severity: "error",
    tables: ["observation"],
    description:
      "Observation 的 sensorId 必须引用已导入的 Sensor。跨表引用完整性，是观测数据可追溯的前提。",
    skipReason: (ctx) =>
      ctx.hasTable.sensor
        ? null
        : "未导入 Sensor 表，无法判定观测引用的传感器是否存在，已跳过以避免误报",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const sensorId = val(rec, "sensorId");
      if (sensorId === "") continue; // 必填缺失由导入校验与 R018 处理
      if (!ctx.idSet.sensor.has(sensorId)) {
        issues.push(
          rowIssue(
            rule,
            "observation",
            rowNumber,
            rec,
            "sensorId",
            `观测引用的传感器「${sensorId}」不存在于 Sensor 表`,
            "请核对 sensorId 拼写，或先导入包含该传感器的 Sensor 表。",
          ),
        );
      }
    }
    return issues;
  },
);

export const R017_ObservationTimestampInvalid = defineRule(
  {
    id: "R017",
    name: "观测时间非法",
    category: "convention",
    severity: "warning",
    tables: ["observation"],
    description:
      "Observation 的 timestamp 应为可解析的合法时间（ISO 8601 或 yyyy-MM-dd HH:mm:ss）。空值或无法解析的时间会影响时序分析。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const ts = val(rec, "timestamp");
      if (ts === "") {
        issues.push(
          rowIssue(
            rule,
            "observation",
            rowNumber,
            rec,
            "timestamp",
            "观测时间为空",
            "请填写观测时间，建议 ISO 8601 或 yyyy-MM-dd HH:mm:ss。",
          ),
        );
        continue;
      }
      if (!Number.isFinite(Date.parse(ts))) {
        issues.push(
          rowIssue(
            rule,
            "observation",
            rowNumber,
            rec,
            "timestamp",
            `观测时间「${ts}」不是合法时间`,
            "请使用 ISO 8601（如 2026-08-16T10:00:00Z）或 yyyy-MM-dd HH:mm:ss 格式。",
          ),
        );
      }
    }
    return issues;
  },
);

export const R018_ObservationValueInvalid = defineRule(
  {
    id: "R018",
    name: "观测值非法",
    category: "completeness",
    severity: "error",
    tables: ["observation"],
    description:
      "Observation 的 value 必须非空且可解析为有限数值。空值或非数值会导致统计与告警失效。",
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const v = val(rec, "value");
      if (v === "") {
        issues.push(
          rowIssue(
            rule,
            "observation",
            rowNumber,
            rec,
            "value",
            "观测值为空",
            "请填写观测值。",
          ),
        );
        continue;
      }
      if (!Number.isFinite(Number(v))) {
        issues.push(
          rowIssue(
            rule,
            "observation",
            rowNumber,
            rec,
            "value",
            `观测值「${v}」不是合法数值`,
            "观测值应为可解析的数值（如 23.5）。",
          ),
        );
      }
    }
    return issues;
  },
);

export const R019_ObservationDuplicateTimestamp = defineRule(
  {
    id: "R019",
    name: "同一测点重复时间戳",
    category: "uniqueness",
    severity: "warning",
    tables: ["observation"],
    description:
      "同一 sensorId 与 timestamp 组合应唯一。重复观测会掩盖真实时序，建议合并或去重。",
  },
  (ctx, rule) => {
    const counts = new Map<string, number>();
    for (const rec of ctx.dataset.observations) {
      const key = observationKey(rec);
      if (key == null) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const seen = new Set<string>();
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const key = observationKey(rec);
      if (key == null) continue;
      if ((counts.get(key) ?? 0) > 1 && !seen.has(key)) {
        seen.add(key);
        issues.push(
          rowIssue(
            rule,
            "observation",
            rowNumber,
            rec,
            "timestamp",
            `同一传感器「${val(rec, "sensorId")}」在时间「${val(rec, "timestamp")}」存在重复观测`,
            "观测应按（传感器, 时间）唯一，请合并或删除重复记录。",
          ),
        );
      }
    }
    return issues;
  },
);
