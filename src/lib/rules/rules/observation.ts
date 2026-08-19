/**
 * 观测类规则（v0.8.0）
 * Observation 为 Sensor 产生的观测读数，规则聚焦跨表引用、时间合法、数值可解析与去重。
 * 复用既有 6 个类别（reference / convention / completeness / uniqueness），
 * 质量评分与报告无需改结构即可纳入。
 */

import { indexed, rowIssue, val } from "../dataset";
import { defineRule } from "../define";
import { UNITS_BY_QUANTITY, knownQuantity, unitMatches } from "../spec";
import type { Issue, LooseRecord } from "../types";

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

/**
 * 观测治理增强规则（v0.9.0）
 * 聚焦观测表自身的量纲/单位一致性、质量标记、时间合理性、量纲/单位完整性，
 * 以及「测点是否产生观测」的覆盖度。全部为纯函数、确定性、可溯源。
 * 关键：观测类规则在观测表为空时统一跳过，避免对「仅三表」项目（如
 * industrialPark / messyPark 这类 observations:[] 样例）产生假阳性。
 */

/** 观测质量标记允许值（与 cityInfraClean 等样例保持一致）。 */
export const QUALITY_VALUES = ["good", "bad", "questionable"] as const;
export type QualityValue = (typeof QUALITY_VALUES)[number];

/** 统计每个测点被观测引用的次数。 */
function observationCountBySensor(observations: LooseRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const rec of observations) {
    const sid = val(rec, "sensorId");
    if (sid === "") continue;
    map.set(sid, (map.get(sid) ?? 0) + 1);
  }
  return map;
}

export const R020_ObservationUnitMismatch = defineRule(
  {
    id: "R020",
    name: "观测量纲与单位不匹配",
    category: "convention",
    severity: "warning",
    tables: ["observation"],
    description:
      "观测的单位应与其量纲匹配（如量纲为温度、单位为 kPa）。单位错误会让后续统计与告警口径失真。量纲不在内置对照表中的记录会被跳过，不做判定。",
    skipReason: (ctx) => (ctx.hasTable.observation ? null : "观测表为空，无量纲可校验"),
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const quantity = val(rec, "quantity");
      const unit = val(rec, "unit");
      if (quantity === "" || unit === "") continue; // 缺失由 R024 / 必填负责
      if (!knownQuantity(quantity)) continue;
      if (unitMatches(quantity, unit)) continue;
      const allowed = UNITS_BY_QUANTITY[quantity].join(" / ");
      issues.push(
        rowIssue(
          rule,
          "observation",
          rowNumber,
          rec,
          "unit",
          `观测量纲「${quantity}」与单位「${unit}」不匹配（该量纲允许：${allowed}）`,
          "核对现场点表，修正单位；若为项目特有单位，请扩充量纲对照表。",
        ),
      );
    }
    return issues;
  },
);

export const R021_ObservationQualityInvalid = defineRule(
  {
    id: "R021",
    name: "观测质量标记非法",
    category: "convention",
    severity: "warning",
    tables: ["observation"],
    description:
      "观测的质量标记（quality）应在允许值内（good / bad / questionable）。非法标记会影响数据可信度评估。为空表示未标记，不做判定。",
    skipReason: (ctx) => (ctx.hasTable.observation ? null : "观测表为空，无质量标记可校验"),
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const quality = val(rec, "quality");
      if (quality === "") continue; // 可选字段，空表示未标记
      if ((QUALITY_VALUES as readonly string[]).includes(quality)) continue;
      issues.push(
        rowIssue(
          rule,
          "observation",
          rowNumber,
          rec,
          "quality",
          `观测质量标记「${quality}」不在允许范围（${QUALITY_VALUES.join(" / ")}）`,
          "将质量标记改为允许值之一（good / bad / questionable）。",
        ),
      );
    }
    return issues;
  },
);

export const R022_ObservationTimestampOutOfRange = defineRule(
  {
    id: "R022",
    name: "观测时间超出合理范围",
    category: "convention",
    severity: "warning",
    tables: ["observation"],
    description:
      "观测时间应落在合理年份区间（2000–2100）。可解析但明显异常的时间（如 1970、9999）通常来自采集系统故障或时区错误。空值与无法解析时间由 R017 负责。",
    skipReason: (ctx) => (ctx.hasTable.observation ? null : "观测表为空，无时间可校验"),
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const ts = val(rec, "timestamp");
      if (ts === "") continue; // R017 负责空值
      const time = Date.parse(ts);
      if (!Number.isFinite(time)) continue; // R017 负责无法解析
      const year = new Date(time).getUTCFullYear();
      if (year >= 2000 && year <= 2100) continue;
      issues.push(
        rowIssue(
          rule,
          "observation",
          rowNumber,
          rec,
          "timestamp",
          `观测时间年份 ${year} 超出合理范围（2000–2100）`,
          "核对采集系统时钟与数据导出时区，修正异常时间戳。",
        ),
      );
    }
    return issues;
  },
);

export const R023_SensorWithoutObservation = defineRule(
  {
    id: "R023",
    name: "测点缺少观测数据",
    category: "coverage",
    severity: "info",
    tables: ["sensor"],
    description:
      "测点没有任何观测记录，意味着该测点在孪生场景中没有时序数据，可能是采集未接入或导出遗漏。仅在已导入观测表时才做判定，避免对「仅设备/测点」项目误报。",
    skipReason: (ctx) => {
      if (!ctx.hasTable.sensor) return "测点表为空，无覆盖度可校验";
      if (!ctx.hasTable.observation)
        return "未导入观测表，无法判定测点是否有观测数据，已跳过以避免误报";
      return null;
    },
  },
  (ctx, rule) => {
    const counts = observationCountBySensor(ctx.dataset.observations);
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.sensors)) {
      const id = val(rec, "id");
      if (id === "") continue;
      if ((counts.get(id) ?? 0) > 0) continue;
      issues.push(
        rowIssue(
          rule,
          "sensor",
          rowNumber,
          rec,
          "id",
          `测点「${id}」没有任何观测记录`,
          "接入该测点的采集链路，或确认本期范围内该测点确实无观测数据。",
        ),
      );
    }
    return issues;
  },
);

export const R024_ObservationMissingQuantityOrUnit = defineRule(
  {
    id: "R024",
    name: "观测缺少量纲或单位",
    category: "completeness",
    severity: "warning",
    tables: ["observation"],
    description:
      "观测具备数值时，量纲（quantity）与单位（unit）应同时给出，否则无法正确解读数值含义。两者皆空或其一为空均在此提示。",
    skipReason: (ctx) => (ctx.hasTable.observation ? null : "观测表为空，无量纲/单位可校验"),
  },
  (ctx, rule) => {
    const issues: Issue[] = [];
    for (const { rec, rowNumber } of indexed(ctx.dataset.observations)) {
      const quantity = val(rec, "quantity");
      const unit = val(rec, "unit");
      if (quantity !== "" && unit !== "") continue;
      const missing = quantity === "" && unit === "" ? "量纲与单位" : quantity === "" ? "量纲" : "单位";
      const field = quantity === "" && unit === "" ? "quantity" : quantity === "" ? "quantity" : "unit";
      issues.push(
        rowIssue(
          rule,
          "observation",
          rowNumber,
          rec,
          field,
          `观测缺少${missing}`,
          "补充该观测的量纲与单位，使其数值可被正确解读。",
        ),
      );
    }
    return issues;
  },
);
