/**
 * 校验规则引擎对外出口（v0.3.0）
 */

export * from "./types";
export * from "./spec";
export {
  buildContext,
  emptyDataset,
  indexed,
  makeDataset,
  raw,
  toRuleDataset,
  val,
} from "./dataset";
export { defineRule } from "./define";
export { ALL_RULES, findRule } from "./registry";
export {
  compareIssues,
  filterBySeverity,
  filterByTable,
  hasBlockingIssues,
  runRules,
  traceText,
} from "./engine";
