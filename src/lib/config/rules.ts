/**
 * 配置驱动规则（v1.1.0）
 *
 * 由 ModelConfig 动态生成通用校验规则：必填 / 枚举 / 引用完整性 / 唯一。
 * 仅对四张核心对象类型（space/asset/sensor/observation）生成，与 RuleDataset
 * 的 TableName 对齐；自定义（第 5+）对象类型在本版本不生成规则（见 model.ts 边界）。
 *
 * 这些规则与「内置规则包」互补：当关闭内置包、仅启用配置包时，校验将完全由
 * 模型配置驱动。规则 ID 以 "C-" 前缀，确定性、可溯源。
 */

import { indexed, rowIssue, tableRecords, val } from "../rules/dataset";
import { defineRule } from "../rules/define";
import type {
  Issue,
  LooseRecord,
  Rule,
  RuleContext,
  TableName,
} from "../rules/types";
import {
  isCoreType,
  type EnumDef,
  type FieldDef,
  type ModelConfig,
  type ObjectType,
} from "./model";

/** 构造行级问题，记录 ID 取自对象类型主键字段（而非固定 "id"）。 */
function cfgRow(
  rule: Rule,
  table: TableName,
  rowNumber: number,
  rec: LooseRecord,
  keyField: string,
  field: string,
  message: string,
  hint: string,
): Issue {
  const base = rowIssue(rule, table, rowNumber, rec, field, message, hint);
  const id = val(rec, keyField).trim();
  return { ...base, recordId: id === "" ? null : id };
}

function makeRequiredRule(ot: ObjectType, f: FieldDef, table: TableName): Rule {
  return defineRule(
    {
      id: `C-${ot.id}-${f.key}-req`,
      name: `${ot.label}·${f.label}必填`,
      category: "completeness",
      severity: "error",
      tables: [table],
      description: `依据模型配置，「${ot.label}」的「${f.label}」为必填字段。`,
    },
    (ctx, rule) => {
      const issues: Issue[] = [];
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        if (val(rec, f.key).trim() !== "") continue;
        issues.push(
          cfgRow(
            rule,
            table,
            rowNumber,
            rec,
            ot.keyField,
            f.key,
            `${f.label}为空（必填）`,
            `补填该行的${f.label}。`,
          ),
        );
      }
      return issues;
    },
  );
}

function makeEnumRule(
  ot: ObjectType,
  f: FieldDef,
  table: TableName,
  enumDef?: EnumDef,
): Rule {
  const enumLabel = enumDef?.label ?? f.enumRef ?? "?";
  return defineRule(
    {
      id: `C-${ot.id}-${f.key}-enum`,
      name: `${ot.label}·${f.label}枚举`,
      category: "convention",
      severity: "error",
      tables: [table],
      description: `依据模型配置，「${ot.label}」的「${f.label}」取值须属于枚举「${enumLabel}」。`,
      skipReason: enumDef
        ? undefined
        : () => `枚举「${f.enumRef}」未定义，跳过枚举校验`,
    },
    (ctx, rule) => {
      if (!enumDef) return [];
      const allowed = new Set(enumDef.values);
      const issues: Issue[] = [];
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        const v = val(rec, f.key).trim();
        if (v === "") continue; // 空由必填规则处理
        if (allowed.has(v)) continue;
        issues.push(
          cfgRow(
            rule,
            table,
            rowNumber,
            rec,
            ot.keyField,
            f.key,
            `${f.label}「${v}」不在枚举取值范围内`,
            `修正该行的${f.label}，合法取值：${enumDef.values.join("、")}。`,
          ),
        );
      }
      return issues;
    },
  );
}

function makeRefRule(ot: ObjectType, f: FieldDef, table: TableName): Rule {
  const target = f.refType ?? "";
  return defineRule(
    {
      id: `C-${ot.id}-${f.key}-ref`,
      name: `${ot.label}·${f.label}引用`,
      category: "reference",
      severity: "error",
      tables: [table],
      description: `依据模型配置，「${ot.label}」的「${f.label}」须引用「${target}」中存在的记录。`,
      skipReason: (ctx: RuleContext) =>
        ctx.hasType[target]
          ? null
          : `「${target}」无数据，跳过引用校验以避免误报`,
    },
    (ctx, rule) => {
      const known = ctx.typeIdSet[target] ?? new Set<string>();
      const issues: Issue[] = [];
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        const ref = val(rec, f.key).trim();
        if (ref === "") {
          if (f.required) {
            issues.push(
              cfgRow(
                rule,
                table,
                rowNumber,
                rec,
                ot.keyField,
                f.key,
                `${f.label}为空（必填引用）`,
                `补填该行的${f.label}。`,
              ),
            );
          }
          continue;
        }
        if (known.has(ref)) continue;
        issues.push(
          cfgRow(
            rule,
            table,
            rowNumber,
            rec,
            ot.keyField,
            f.key,
            `${f.label}「${ref}」在${target}中不存在`,
            `确认被引用对象是否漏导入，或修正该行的${f.label}。`,
          ),
        );
      }
      return issues;
    },
  );
}

function makeUniqueRule(ot: ObjectType, f: FieldDef, table: TableName): Rule {
  return defineRule(
    {
      id: `C-${ot.id}-${f.key}-uniq`,
      name: `${ot.label}·${f.label}唯一`,
      category: "uniqueness",
      severity: "error",
      tables: [table],
      description: `依据模型配置，「${ot.label}」的「${f.label}」在对象类型内应唯一。`,
    },
    (ctx, rule) => {
      const seen = new Map<string, number>();
      const issues: Issue[] = [];
      for (const { rec, rowNumber } of indexed(tableRecords(ctx.dataset, table))) {
        const v = val(rec, f.key).trim();
        if (v === "") continue;
        const first = seen.get(v);
        if (first === undefined) {
          seen.set(v, rowNumber);
          continue;
        }
        issues.push(
          cfgRow(
            rule,
            table,
            rowNumber,
            rec,
            ot.keyField,
            f.key,
            `${f.label}「${v}」重复（首次出现在第 ${first} 行）`,
            `为该行的${f.label}赋唯一值。`,
          ),
        );
      }
      return issues;
    },
  );
}

/**
 * 由模型配置生成配置驱动规则（仅核心四表）。
 * 同一 ModelConfig 必然产出同一规则集合（确定性）。
 */
export function buildConfigRules(model: ModelConfig): Rule[] {
  const rules: Rule[] = [];
  const enumById = new Map(model.enums.map((e) => [e.id, e]));
  for (const ot of model.objectTypes) {
    if (!isCoreType(ot.id)) continue; // 仅核心四表在本版本由配置驱动
    const table = ot.id as TableName;
    for (const f of ot.fields) {
      if (f.required) rules.push(makeRequiredRule(ot, f, table));
      if (f.type === "enum")
        rules.push(makeEnumRule(ot, f, table, enumById.get(f.enumRef ?? "")));
      if (f.type === "ref") rules.push(makeRefRule(ot, f, table));
      if (f.unique) rules.push(makeUniqueRule(ot, f, table));
    }
  }
  return rules;
}

/** 由模型配置构造配置包（id 固定为 "config"）。 */
export function buildConfigPackage(model: ModelConfig) {
  return {
    id: "config",
    label: "配置驱动规则包",
    description: "由当前模型配置动态生成的通用规则：必填 / 枚举 / 引用完整性 / 唯一。",
    rules: buildConfigRules(model),
  };
}
