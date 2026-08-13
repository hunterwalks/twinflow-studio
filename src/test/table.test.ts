import { describe, expect, it } from "vitest";
import {
  ASSET_COLUMNS,
  SENSOR_COLUMNS,
  SPACE_COLUMNS,
  assetRows,
  deriveColumns,
  sensorRows,
  spaceRows,
} from "@/lib/table";
import { industrialPark } from "@/lib/data/industrialPark";

describe("工作表预览派生", () => {
  it("空记录派生出空列", () => {
    expect(deriveColumns([])).toEqual([]);
  });

  it("Space 行数与列数正确，且父级为空时显示占位符", () => {
    const rows = spaceRows(industrialPark);
    expect(rows).toHaveLength(industrialPark.spaces.length);
    expect(SPACE_COLUMNS.map((c) => c.key)).toEqual(["id", "name", "type", "parentId", "description"]);
    const root = industrialPark.spaces.find((s) => s.parentId === null);
    if (root) {
      const row = rows.find((r) => r.id === root.id);
      expect(row?.parentId).toBe("—");
    }
  });

  it("Asset 行引用空间 ID", () => {
    const rows = assetRows(industrialPark);
    expect(rows).toHaveLength(industrialPark.assets.length);
    expect(ASSET_COLUMNS.map((c) => c.key)).toEqual(["id", "name", "type", "spaceId", "description"]);
  });

  it("Sensor 行包含量测与单位", () => {
    const rows = sensorRows(industrialPark);
    expect(rows).toHaveLength(industrialPark.sensors.length);
    expect(SENSOR_COLUMNS.map((c) => c.key)).toEqual(["id", "name", "assetId", "quantity", "unit", "description"]);
    expect(rows[0].unit).toBeTruthy();
  });
});
