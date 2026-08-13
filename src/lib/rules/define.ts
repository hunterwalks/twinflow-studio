/**
 * 规则定义工厂（v0.3.0）
 * 让 run 能拿到规则自身元信息，避免在对象字面量中依赖 this。
 */

import type { Issue, Rule, RuleContext } from "./types";

export type RuleMeta = Omit<Rule, "run">;

export function defineRule(
  meta: RuleMeta,
  run: (ctx: RuleContext, rule: Rule) => Issue[],
): Rule {
  const rule: Rule = {
    ...meta,
    run: (ctx) => run(ctx, rule),
  };
  return rule;
}
