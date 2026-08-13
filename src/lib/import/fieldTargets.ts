/**
 * 导入目标字段定义（v0.2.0）
 * 用于字段映射 UI 与表头自动匹配。新增对象类型时在此扩展，不影响现有领域模型。
 */

export type ImportTargetType = "space" | "asset" | "sensor";

export interface TargetField {
  /** 领域模型字段名（与 types.ts 的 Zod schema 一致） */
  key: string;
  /** 中文展示名 */
  label: string;
  /** 是否必填（缺失或为空将产生导入错误） */
  required: boolean;
  /** 是否可空（导入时空单元格视作 null，即「无值」） */
  nullable?: boolean;
  /** 表头别名（小写归一化后匹配），用于智能默认映射 */
  aliases: string[];
}

export const TARGET_TYPES: { key: ImportTargetType; label: string }[] = [
  { key: "space", label: "空间 Space" },
  { key: "asset", label: "资产 Asset" },
  { key: "sensor", label: "传感器 Sensor" },
];

export const TARGET_FIELDS: Record<ImportTargetType, TargetField[]> = {
  space: [
    { key: "id", label: "ID", required: true, aliases: ["id", "spaceid", "space id", "编号", "标识", "编码"] },
    { key: "name", label: "名称", required: true, aliases: ["name", "名称", "名字", "spacename", "空间名称", "空间名"] },
    { key: "type", label: "类型", required: true, aliases: ["type", "类型", "spacetype", "空间类型", "kind", "种类"] },
    { key: "parentId", label: "父级ID", required: false, nullable: true, aliases: ["parentid", "parent id", "父级", "父级id", "上级", "parent", "所属"] },
    { key: "description", label: "描述", required: false, aliases: ["description", "描述", "备注", "desc", "说明", "注释"] },
  ],
  asset: [
    { key: "id", label: "ID", required: true, aliases: ["id", "assetid", "asset id", "编号", "标识", "编码"] },
    { key: "name", label: "名称", required: true, aliases: ["name", "名称", "名字", "assetname", "资产名称", "资产名"] },
    { key: "type", label: "类型", required: true, aliases: ["type", "类型", "assettype", "资产类型", "kind", "种类", "类别"] },
    { key: "spaceId", label: "空间ID", required: true, aliases: ["spaceid", "space id", "空间id", "空间", "所属空间", "location", "位置"] },
    { key: "description", label: "描述", required: false, aliases: ["description", "描述", "备注", "desc", "说明", "注释"] },
  ],
  sensor: [
    { key: "id", label: "ID", required: true, aliases: ["id", "sensorid", "sensor id", "编号", "标识", "编码"] },
    { key: "name", label: "名称", required: true, aliases: ["name", "名称", "名字", "sensorname", "测点名称", "传感器名称", "测点"] },
    { key: "assetId", label: "资产ID", required: true, aliases: ["assetid", "asset id", "资产id", "资产", "所属资产", "设备id", "设备"] },
    { key: "quantity", label: "量测", required: true, aliases: ["quantity", "量测", "测量量", "测点量", "metric", "measurement", "指标"] },
    { key: "unit", label: "单位", required: true, aliases: ["unit", "单位", "量纲", "units", "单位量纲"] },
    { key: "description", label: "描述", required: false, aliases: ["description", "描述", "备注", "desc", "说明", "注释"] },
  ],
};

/** 归一化表头用于匹配：小写、去空白与常见标点。 */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()（）:：·]/g, "")
    .replace(/[，,]/g, "");
}
