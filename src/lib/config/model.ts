/**
 * 模型配置（v1.1.0）
 *
 * 可配置对象模型：对象类型、字段、枚举、关系。作为校验引擎「配置驱动规则」
 * 的单一事实来源（single source of truth）。内置规则包仅覆盖四张核心表，
 * 配置包则依据本配置生成通用校验规则（必填 / 枚举 / 引用 / 唯一）。
 *
 * 设计边界（明确不做图形化低代码平台）：
 * - 配置以版本化 JSON 表示，可导入 / 导出；
 * - 当前配置驱动规则覆盖四张核心对象类型（space/asset/sensor/observation）；
 *   自定义（第 5+）对象类型在 schema 层面受支持、可在 /model 查看与导出，
 *   其端到端校验留待后续版本。
 */

import { z } from "zod";
import { SPACE_TYPE_VALUES } from "@/lib/rules/spec";

/** 当前模型配置版本。新增破坏性字段时升版并补充 migrateModelConfig。 */
export const MODEL_CONFIG_VERSION = 1;

/** 四张核心对象类型 ID（与 RuleDataset / TableName 对齐）。 */
export const CORE_TYPE_IDS = ["space", "asset", "sensor", "observation"] as const;
export type CoreTypeId = (typeof CORE_TYPE_IDS)[number];

/** 字段类型。 */
export const FieldTypeEnum = z.enum(["string", "number", "enum", "ref"]);
export type FieldType = z.infer<typeof FieldTypeEnum>;

export const FieldDefSchema = z.object({
  /** 字段键，唯一标识（如 id / name / spaceId） */
  key: z.string().min(1),
  /** 字段中文标签 */
  label: z.string().min(1),
  /** 字段类型 */
  type: FieldTypeEnum,
  /** 是否必填 */
  required: z.boolean(),
  /** type === "enum" 时引用的枚举 ID */
  enumRef: z.string().min(1).optional(),
  /** type === "ref" 时引用的目标对象类型 ID */
  refType: z.string().min(1).optional(),
  /** 是否在对象类型内唯一（基于 keyField 所在记录集） */
  unique: z.boolean().optional(),
});
export type FieldDef = z.infer<typeof FieldDefSchema>;

export const ObjectTypeSchema = z.object({
  /** 对象类型 ID，需与数据表名一致（核心类型为 space/asset/sensor/observation） */
  id: z.string().min(1),
  /** 对象类型中文标签 */
  label: z.string().min(1),
  /** 主键字段键（用于记录定位与问题溯源） */
  keyField: z.string().min(1),
  /** 字段定义（至少 1 个） */
  fields: z.array(FieldDefSchema).min(1),
});
export type ObjectType = z.infer<typeof ObjectTypeSchema>;

export const EnumDefSchema = z.object({
  /** 枚举 ID */
  id: z.string().min(1),
  /** 枚举中文标签 */
  label: z.string().min(1),
  /** 枚举取值（至少 1 个） */
  values: z.array(z.string().min(1)).min(1),
});
export type EnumDef = z.infer<typeof EnumDefSchema>;

export const ModelConfigSchema = z.object({
  /** 配置版本（当前固定为 1） */
  configVersion: z.literal(MODEL_CONFIG_VERSION),
  /** 配置名称 */
  name: z.string().min(1),
  /** 对象类型定义 */
  objectTypes: z.array(ObjectTypeSchema).min(1),
  /** 枚举定义（可为空） */
  enums: z.array(EnumDefSchema),
});
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

/** 语义校验错误条目。 */
export interface ConfigValidationError {
  path: string;
  message: string;
}

/**
 * 校验模型配置（结构化错误，便于 UI 展示）。
 * 先过 Zod 结构校验，再做跨字段引用校验（enumRef / refType / keyField 必须存在）。
 */
export function validateModelConfig(raw: unknown): {
  ok: boolean;
  config?: ModelConfig;
  errors: ConfigValidationError[];
} {
  const parsed = ModelConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: ConfigValidationError[] = parsed.error.issues.map((i) => ({
      path: i.path.join(".") || "(root)",
      message: i.message,
    }));
    return { ok: false, errors };
  }
  const cfg = parsed.data;
  const errors: ConfigValidationError[] = [];

  const enumIds = new Set(cfg.enums.map((e) => e.id));
  const typeIds = new Set(cfg.objectTypes.map((t) => t.id));

  for (const ot of cfg.objectTypes) {
    if (!ot.fields.some((f) => f.key === ot.keyField)) {
      errors.push({
        path: `objectTypes.${ot.id}.keyField`,
        message: `keyField「${ot.keyField}」不在字段列表中`,
      });
    }
    for (const f of ot.fields) {
      if (f.type === "enum" && f.enumRef && !enumIds.has(f.enumRef)) {
        errors.push({
          path: `objectTypes.${ot.id}.fields.${f.key}.enumRef`,
          message: `引用的枚举「${f.enumRef}」未定义`,
        });
      }
      if (f.type === "ref" && f.refType && !typeIds.has(f.refType)) {
        errors.push({
          path: `objectTypes.${ot.id}.fields.${f.key}.refType`,
          message: `引用的对象类型「${f.refType}」未定义`,
        });
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, config: cfg, errors: [] };
}

/**
 * 版本迁移：当前仅支持 v1。未来破坏性变更在此分支处理。
 * 解析失败（含版本不符）抛出错误，由调用方捕获并提示用户。
 */
export function migrateModelConfig(raw: unknown): ModelConfig {
  if (
    raw &&
    typeof raw === "object" &&
    "configVersion" in (raw as Record<string, unknown>)
  ) {
    const v = (raw as Record<string, unknown>).configVersion;
    if (v !== MODEL_CONFIG_VERSION) {
      throw new Error(
        `不支持的模型配置版本：${String(v)}（当前仅支持 ${MODEL_CONFIG_VERSION}）`,
      );
    }
  }
  return ModelConfigSchema.parse(raw);
}

/** 默认模型配置：与内置四表核心模型一致（含空间类型枚举）。 */
export function defaultModelConfig(): ModelConfig {
  return {
    configVersion: MODEL_CONFIG_VERSION,
    name: "四表核心模型（默认）",
    enums: [
      {
        id: "spaceType",
        label: "空间类型",
        values: [...SPACE_TYPE_VALUES],
      },
    ],
    objectTypes: [
      {
        id: "space",
        label: "空间 Space",
        keyField: "id",
        fields: [
          { key: "id", label: "ID", type: "string", required: true, unique: true },
          { key: "name", label: "名称", type: "string", required: true },
          { key: "type", label: "类型", type: "enum", required: true, enumRef: "spaceType" },
          { key: "parentId", label: "父级ID", type: "ref", required: false, refType: "space" },
          { key: "description", label: "描述", type: "string", required: false },
        ],
      },
      {
        id: "asset",
        label: "设备 Asset",
        keyField: "id",
        fields: [
          { key: "id", label: "ID", type: "string", required: true, unique: true },
          { key: "name", label: "名称", type: "string", required: true },
          { key: "type", label: "类型", type: "string", required: true },
          { key: "spaceId", label: "空间ID", type: "ref", required: true, refType: "space" },
          { key: "description", label: "描述", type: "string", required: false },
        ],
      },
      {
        id: "sensor",
        label: "测点 Sensor",
        keyField: "id",
        fields: [
          { key: "id", label: "ID", type: "string", required: true, unique: true },
          { key: "name", label: "名称", type: "string", required: true },
          { key: "assetId", label: "设备ID", type: "ref", required: true, refType: "asset" },
          { key: "quantity", label: "量纲", type: "string", required: true },
          { key: "unit", label: "单位", type: "string", required: true },
          { key: "description", label: "描述", type: "string", required: false },
        ],
      },
      {
        id: "observation",
        label: "观测 Observation",
        keyField: "id",
        fields: [
          { key: "id", label: "ID", type: "string", required: false, unique: true },
          { key: "sensorId", label: "测点ID", type: "ref", required: true, refType: "sensor" },
          { key: "timestamp", label: "时间戳", type: "string", required: true },
          { key: "value", label: "数值", type: "string", required: true },
          { key: "quantity", label: "量纲", type: "string", required: false },
          { key: "unit", label: "单位", type: "string", required: false },
          { key: "quality", label: "质量", type: "string", required: false },
        ],
      },
    ],
  };
}

/** 按 ID 取枚举。 */
export function findEnum(model: ModelConfig, id: string): EnumDef | undefined {
  return model.enums.find((e) => e.id === id);
}

/** 按 ID 取对象类型。 */
export function findObjectType(model: ModelConfig, id: string): ObjectType | undefined {
  return model.objectTypes.find((t) => t.id === id);
}

/** 是否为四张核心对象类型之一。 */
export function isCoreType(id: string): boolean {
  return (CORE_TYPE_IDS as readonly string[]).includes(id);
}
