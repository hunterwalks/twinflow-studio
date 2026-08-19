/**
 * 报告聚合（v0.6.0）
 *
 * 由当前数据集聚合出完整报告：校验报告 + 质量评分 + 规则建议。
 * 纯函数、确定性：同一份数据集 + 相同 generatedAt 必然得到同一份报告。
 */

import { runRules } from "@/lib/rules/engine";
import { qualityScore } from "@/lib/quality/score";
import { recommendRules } from "@/lib/quality/recommend";
import type { RuleDataset } from "@/lib/rules/types";
import type { TwinFlowReport } from "./types";

/** 报告内携带的应用版本号。 */
export const REPORT_VERSION = "0.6.0";

export interface BuildReportInput {
  dataset: RuleDataset;
  /** 数据来源标签（中文）；缺省为「手动构建」 */
  source?: string;
  /** 覆盖生成时间（用于测试确定性）；缺省取当前时间 */
  generatedAt?: string;
}

/**
 * 由数据集聚合出完整报告。
 * 复用既有的校验引擎、质量评分与规则建议，保证与页面展示完全一致。
 */
export function buildReport(input: BuildReportInput): TwinFlowReport {
  const dataset = input.dataset;
  const validation = runRules(dataset);
  const quality = qualityScore(validation);
  const recommendations = recommendRules(dataset);

  const spaces = dataset.spaces.length;
  const assets = dataset.assets.length;
  const sensors = dataset.sensors.length;
  const observations = dataset.observations.length;

  return {
    meta: {
      tool: "TwinFlow Studio",
      version: REPORT_VERSION,
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      source: input.source ?? "手动构建",
      recordCount: {
        spaces,
        assets,
        sensors,
        observations,
        total: spaces + assets + sensors + observations,
      },
    },
    dataset,
    validation,
    quality,
    recommendations,
  };
}
