import { SPACE_TYPE_LABEL, type Asset, type IndustrialPark, type Sensor, type Space } from "./types";

export interface Column {
  key: string;
  header: string;
}

export type Row = Record<string, string>;

/** 虚拟滚动的可视区间（v1.0.0）。纯函数、确定性。 */
export interface WindowRange {
  /** 可视区起始行（含 overscan） */
  start: number;
  /** 可视区结束行（不含，含 overscan） */
  end: number;
  /** 起始行在容器内的纵向偏移（px） */
  offsetY: number;
  /** 全部内容总高度（px） */
  totalHeight: number;
}

/**
 * 由滚动位置与视口高度计算应渲染的行区间。
 * 采用固定行高模型：`start = floor(scrollTop / rowHeight) - overscan`，
 * 两侧各补 overscan 行避免快速滚动露白。纯函数，可直接单元测试。
 */
export function visibleRange(opts: {
  total: number;
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  overscan?: number;
}): WindowRange {
  const { total, scrollTop, viewportHeight, rowHeight, overscan = 6 } = opts;
  if (total <= 0 || rowHeight <= 0) {
    return { start: 0, end: 0, offsetY: 0, totalHeight: 0 };
  }
  // 防御性收敛：scrollTop 越界（含超出浏览器最大可滚动位置）时，
  // start 不得越过最后一行索引，避免 offsetY 溢出与空渲染。
  const rawStart = Math.floor(scrollTop / rowHeight) - overscan;
  const start = Math.max(0, Math.min(rawStart, Math.max(0, total - 1)));
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const end = Math.min(total, start + visibleCount);
  return { start, end, offsetY: start * rowHeight, totalHeight: total * rowHeight };
}

/** 由记录派生工作表式列（按字段顺序，附中文表头）。 */
export function deriveColumns(records: Row[]): Column[] {
  if (records.length === 0) return [];
  return Object.keys(records[0]).map((key) => ({ key, header: key }));
}

function spaceTypeLabel(type: Space["type"]): string {
  return SPACE_TYPE_LABEL[type];
}

export function spaceRows(data: IndustrialPark): Row[] {
  return data.spaces.map((s: Space) => ({
    id: s.id,
    name: s.name,
    type: spaceTypeLabel(s.type),
    parentId: s.parentId ?? "—",
    description: s.description,
  }));
}

export function assetRows(data: IndustrialPark): Row[] {
  return data.assets.map((a: Asset) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    spaceId: a.spaceId,
    description: a.description,
  }));
}

export function sensorRows(data: IndustrialPark): Row[] {
  return data.sensors.map((s: Sensor) => ({
    id: s.id,
    name: s.name,
    assetId: s.assetId,
    quantity: s.quantity,
    unit: s.unit,
    description: s.description,
  }));
}

export const SPACE_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "名称" },
  { key: "type", header: "类型" },
  { key: "parentId", header: "父级ID" },
  { key: "description", header: "描述" },
];

export const ASSET_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "名称" },
  { key: "type", header: "类型" },
  { key: "spaceId", header: "空间ID" },
  { key: "description", header: "描述" },
];

export const SENSOR_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "名称" },
  { key: "assetId", header: "资产ID" },
  { key: "quantity", header: "量测" },
  { key: "unit", header: "单位" },
  { key: "description", header: "描述" },
];

export const OBSERVATION_COLUMNS: Column[] = [
  { key: "id", header: "ID" },
  { key: "sensorId", header: "测点ID" },
  { key: "timestamp", header: "时间戳" },
  { key: "value", header: "观测值" },
  { key: "quantity", header: "量测" },
  { key: "unit", header: "单位" },
  { key: "quality", header: "质量" },
];
