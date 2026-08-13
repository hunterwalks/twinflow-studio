import { SPACE_TYPE_LABEL, type Asset, type IndustrialPark, type Sensor, type Space } from "./types";

export interface Column {
  key: string;
  header: string;
}

export type Row = Record<string, string>;

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
