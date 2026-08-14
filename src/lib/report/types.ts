/**
 * 报告导出类型定义（v0.6.0）
 *
 * 一份完整报告 = 当前数据集 + 校验报告 + 质量评分 + 规则建议 的可序列化快照。
 * 结构与顺序固定，便于 JSON 往返与 HTML 渲染复用。
 */

import type { RuleDataset, ValidationReport } from "@/lib/rules/types";
import type { QualityScore } from "@/lib/quality/score";
import type { RuleRecommendation } from "@/lib/quality/recommend";

/** 三表记录数汇总。 */
export interface ReportRecordCount {
  spaces: number;
  assets: number;
  sensors: number;
  total: number;
}

/** 报告元信息（放最前，便于一眼看到来源与时间）。 */
export interface ReportMeta {
  tool: "TwinFlow Studio";
  /** 应用版本号，如 "0.6.0" */
  version: string;
  /** 报告生成时间（ISO 8601 字符串） */
  generatedAt: string;
  /** 数据来源标签（中文） */
  source: string;
  recordCount: ReportRecordCount;
}

/** 完整报告快照。 */
export interface TwinFlowReport {
  meta: ReportMeta;
  /** 原始宽松数据集（三表记录） */
  dataset: RuleDataset;
  /** 校验报告（含 issue 溯源、按级别 → 表 → 行号排序） */
  validation: ValidationReport;
  /** 数据质量评分（0–100 / 等级 A–E / 维度） */
  quality: QualityScore;
  /** 规则与治理建议 */
  recommendations: RuleRecommendation[];
}
