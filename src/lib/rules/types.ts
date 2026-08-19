/**
 * 校验规则引擎类型定义（v0.3.0）
 *
 * 设计要点：
 * 1. 规则作用于「宽松数据集」（RuleDataset），因此可以直接校验 v0.2.0 导入产物这类尚未通过 Zod 的数据；
 * 2. 每个 Issue 必须可溯源到「表 / 行号 / 记录ID / 字段」，便于用户直接定位并修复；
 * 3. 规则为纯函数，同一输入必然产出同一问题集合与同一排序。
 */

/** 问题严重级别。 */
export type Severity = "error" | "warning" | "info";

/** 数据表（对应领域模型三类对象）。 */
export type TableName = "space" | "asset" | "sensor" | "observation";

/** 规则类别。 */
export type RuleCategory =
  | "completeness"
  | "uniqueness"
  | "reference"
  | "hierarchy"
  | "coverage"
  | "convention";

/** 宽松记录：字段值一律按字符串处理，缺失视作空。 */
export type LooseRecord = Record<string, string | null | undefined>;

/** 宽松数据集：三张表的记录数组，允许任意表为空。 */
export interface RuleDataset {
  spaces: LooseRecord[];
  assets: LooseRecord[];
  sensors: LooseRecord[];
  observations: LooseRecord[];
}

/** 问题定位范围：row = 定位到具体记录行；table = 整表级问题。 */
export type IssueScope = "row" | "table";

/** 单条校验问题。 */
export interface Issue {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: Severity;
  /** 溯源：表 */
  table: TableName;
  scope: IssueScope;
  /** 溯源：行号（从 1 开始，不含表头）；整表级问题为 null */
  rowNumber: number | null;
  /** 溯源：记录 ID（取不到时为 null） */
  recordId: string | null;
  /** 溯源：字段（整表级问题为 null） */
  field: string | null;
  /** 中文问题描述 */
  message: string;
  /** 修复建议 */
  hint: string;
}

/** 规则执行上下文：预建索引，避免每条规则重复扫描。 */
export interface RuleContext {
  dataset: RuleDataset;
  /** 各表是否有数据（用于跨表规则的跳过判定） */
  hasTable: Record<TableName, boolean>;
  /** 各表已存在的 ID 集合（已去空白） */
  idSet: Record<TableName, Set<string>>;
  /** sensor.assetId 的引用计数，键为 assetId */
  sensorCountByAsset: Map<string, number>;
}

/** 一条校验规则。 */
export interface Rule {
  id: string;
  name: string;
  category: RuleCategory;
  severity: Severity;
  /** 规则作用的表，仅用于文档与筛选展示 */
  tables: TableName[];
  /** 规则意图说明 */
  description: string;
  /**
   * 前置条件判定。返回字符串表示本次跳过该规则（字符串为跳过原因），返回 null 表示正常执行。
   * 用于避免「被引用表未导入时把全部记录判为悬空引用」这类假阳性。
   */
  skipReason?: (ctx: RuleContext) => string | null;
  run: (ctx: RuleContext) => Issue[];
}

/** 规则维度汇总。 */
export interface RuleSummary {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: Severity;
  /** 命中数量；0 表示未命中 */
  count: number;
  /** 非 null 表示本次被跳过及其原因 */
  skipped: string | null;
}

/** 校验报告。 */
export interface ValidationReport {
  issues: Issue[];
  totals: Record<Severity, number> & { all: number };
  byTable: Record<TableName, number>;
  byCategory: Record<RuleCategory, number>;
  byRule: RuleSummary[];
  /** 参与本次校验的规则总数 */
  ruleCount: number;
  /** 命中（产生问题）的规则数 */
  triggeredRuleCount: number;
  /** 通过（执行且未命中）的规则数 */
  passedRuleCount: number;
  /** 跳过的规则数 */
  skippedRuleCount: number;
}

/** 级别中文标签。 */
export const SEVERITY_LABEL: Record<Severity, string> = {
  error: "错误",
  warning: "警告",
  info: "提示",
};

/** 级别排序权重（越小越靠前）。 */
export const SEVERITY_ORDER: Record<Severity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

/** 类别中文标签。 */
export const CATEGORY_LABEL: Record<RuleCategory, string> = {
  completeness: "完整性",
  uniqueness: "唯一性",
  reference: "引用完整性",
  hierarchy: "层级",
  coverage: "覆盖度",
  convention: "规范性",
};

/** 表中文标签。 */
export const TABLE_LABEL: Record<TableName, string> = {
  space: "空间 Space",
  asset: "设备 Asset",
  sensor: "测点 Sensor",
  observation: "观测 Observation",
};

/** 表排序权重。 */
export const TABLE_ORDER: Record<TableName, number> = {
  space: 0,
  asset: 1,
  sensor: 2,
  observation: 3,
};
