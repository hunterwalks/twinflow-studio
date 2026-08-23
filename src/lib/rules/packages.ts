/**
 * 规则包（v1.1.0）
 *
 * 将规则分组为「包」，便于按需启用 / 关闭。内置包承载 24 条针对四表核心模型的
 * 确定性规则；配置包由当前模型配置动态生成（见 @/lib/config/rules）。
 * 校验引擎 runRules 已支持传入规则子集，因此包选择不改变引擎本身。
 */

import { ALL_RULES } from "./registry";
import type { Rule } from "./types";

/** 一个规则包：含标识、说明与规则集合。 */
export interface RulePackage {
  id: string;
  label: string;
  description: string;
  rules: Rule[];
}

/** 内置规则包：四表核心模型的 24 条确定性规则。 */
export const BUILTIN_PACKAGE: RulePackage = {
  id: "builtin",
  label: "内置规则包",
  description:
    "24 条针对四表核心模型（Space/Asset/Sensor/Observation）的确定性校验规则：完整性、唯一性、引用完整性、层级、覆盖度与规范性。",
  rules: ALL_RULES,
};

/**
 * 由若干规则包与「已启用 ID 集合」计算实际运行的规则列表。
 * 顺序保持包顺序 + 包内规则顺序，保证确定性。
 */
export function getEnabledRules(
  packages: RulePackage[],
  enabledIds: string[],
): Rule[] {
  const enabled = new Set(enabledIds);
  const rules: Rule[] = [];
  for (const pkg of packages) {
    if (!enabled.has(pkg.id)) continue;
    rules.push(...pkg.rules);
  }
  return rules;
}
