/**
 * 规则所依赖的字段元数据与领域约定（v0.3.0）
 * 与 v0.1.0 Zod 领域模型保持一致，集中在此以便规则复用。
 */

import type { TableName } from "./types";

/** 字段中文标签（跨表通用，字段名唯一）。 */
export const FIELD_LABEL: Record<string, string> = {
  id: "ID",
  name: "名称",
  type: "类型",
  parentId: "父级ID",
  spaceId: "空间ID",
  assetId: "设备ID",
  quantity: "量纲",
  unit: "单位",
  description: "描述",
};

export function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}

/** 各表全部字段（顺序与预览列一致）。 */
export const ALL_FIELDS: Record<TableName, string[]> = {
  space: ["id", "name", "type", "parentId", "description"],
  asset: ["id", "name", "type", "spaceId", "description"],
  sensor: ["id", "name", "assetId", "quantity", "unit", "description"],
  observation: ["id", "sensorId", "timestamp", "value", "quantity", "unit", "quality"],
};

/**
 * 各表必填字段。
 * 与 Zod 模型一致：space.parentId 可空（空 = 根节点），description 允许为空。
 */
export const REQUIRED_FIELDS: Record<TableName, string[]> = {
  space: ["id", "name", "type"],
  asset: ["id", "name", "type", "spaceId"],
  sensor: ["id", "name", "assetId", "quantity", "unit"],
  observation: ["sensorId", "timestamp", "value"],
};

/** 跨表引用定义。 */
export interface ReferenceSpec {
  /** 引用方表 */
  table: TableName;
  /** 引用方字段 */
  field: string;
  /** 被引用表 */
  target: TableName;
  /** 空值是否合法（space.parentId 空表示根节点） */
  allowEmpty: boolean;
}

export const REFERENCE_SPECS: ReferenceSpec[] = [
  { table: "space", field: "parentId", target: "space", allowEmpty: true },
  { table: "asset", field: "spaceId", target: "space", allowEmpty: false },
  { table: "sensor", field: "assetId", target: "asset", allowEmpty: false },
];

/**
 * 「同层级」的判定字段：在同一父级 / 同一空间 / 同一设备下，名称应唯一。
 */
export const SIBLING_GROUP_FIELD: Record<TableName, string> = {
  space: "parentId",
  asset: "spaceId",
  sensor: "assetId",
  observation: "sensorId",
};

/** 空间类型枚举（与 SpaceTypeEnum 一致）及其层级深度。 */
export const SPACE_TYPE_LEVEL: Record<string, number> = {
  park: 0,
  building: 1,
  floor: 2,
  zone: 3,
};

export const SPACE_TYPE_VALUES = Object.keys(SPACE_TYPE_LEVEL);

/** ID 命名规范：2—4 位字母前缀 + 短横线 + 至少 3 位数字，例如 SP-001。 */
export const ID_PATTERN = /^[A-Za-z]{2,4}-\d{3,}$/;

/** 名称长度上限（超过仅提示，不阻断）。 */
export const NAME_MAX_LENGTH = 40;

/**
 * 量纲与合法单位对照表（大小写不敏感比较）。
 * 量纲不在表中的记录会被 R015 跳过，避免对未知量纲产生假阳性。
 */
export const UNITS_BY_QUANTITY: Record<string, string[]> = {
  温度: ["°C", "℃", "C", "K", "°F", "℉"],
  压力: ["Pa", "kPa", "MPa", "bar", "mbar"],
  流量: ["m³/h", "m3/h", "L/s", "L/min", "L/h"],
  功率: ["W", "kW", "MW"],
  电压: ["V", "kV", "mV"],
  电流: ["A", "mA", "kA"],
  湿度: ["%RH", "%"],
  振动: ["mm/s", "μm", "um", "g"],
  能耗: ["kWh", "MWh", "GJ"],
  转速: ["rpm", "r/min"],
  液位: ["m", "mm", "cm", "%"],
};

export function knownQuantity(quantity: string): boolean {
  return Object.prototype.hasOwnProperty.call(UNITS_BY_QUANTITY, quantity);
}

/** 单位归一化比较：去空白 + 小写。 */
export function unitMatches(quantity: string, unit: string): boolean {
  const allowed = UNITS_BY_QUANTITY[quantity];
  if (!allowed) return true;
  const norm = unit.trim().toLowerCase();
  return allowed.some((u) => u.toLowerCase() === norm);
}
