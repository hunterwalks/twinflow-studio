import type { LooseRecord } from "@/lib/rules/types";
import { industrialPark } from "./industrialPark";
import { messyPark } from "./messyPark";
import { cityInfraClean } from "./cityInfraClean";
import { cityInfraProblem } from "./cityInfraProblem";

/**
 * 统一 Demo 数据集注册表（v0.7.0）
 * 将既有与新增合成数据归一为宽松记录，供 Demo 加载、校验页样例与 E2E 复用。
 * v0.8.0：DemoDataset 新增 observations 第四表（样例数据在 Task 5 填充）。
 */
export interface DemoDataset {
  key: string;
  label: string;
  note: string;
  /** 是否可作为「干净基线」用于确认无规则误报。 */
  clean: boolean;
  spaces: LooseRecord[];
  assets: LooseRecord[];
  sensors: LooseRecord[];
  observations: LooseRecord[];
}

function toLoose<T extends Record<string, unknown>>(rows: T[]): LooseRecord[] {
  return rows.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, v == null ? "" : String(v)]),
    ),
  ) as LooseRecord[];
}

export const DEMO_DATASETS: DemoDataset[] = [
  {
    key: "industrial",
    label: "合成工业园区（干净）",
    note: "v0.1.0 内置，作为干净数据基线，确认无规则误报。",
    clean: true,
    spaces: toLoose(industrialPark.spaces),
    assets: toLoose(industrialPark.assets),
    sensors: toLoose(industrialPark.sensors),
    observations: [],
  },
  {
    key: "city-clean",
    label: "城市基础设施（干净）",
    note: "v0.7.0 新增：结构完整、引用闭合、量纲一致的城市基础设施数据。",
    clean: true,
    spaces: cityInfraClean.spaces,
    assets: cityInfraClean.assets,
    sensors: cityInfraClean.sensors,
    observations: cityInfraClean.observations,
  },
  {
    key: "messy",
    label: "含问题样例（工业园区）",
    note: "合成脏数据，演示各类规则的实际命中效果与溯源信息。",
    clean: false,
    spaces: messyPark.spaces,
    assets: messyPark.assets,
    sensors: messyPark.sensors,
    observations: [],
  },
  {
    key: "city-problem",
    label: "城市基础设施（含问题）",
    note: "v0.7.0 新增：城市基础设施场景下的典型脏数据，用于验证规则与报告。",
    clean: false,
    spaces: cityInfraProblem.spaces,
    assets: cityInfraProblem.assets,
    sensors: cityInfraProblem.sensors,
    observations: [],
  },
];

export function getDemoDataset(key?: string | null): DemoDataset {
  return DEMO_DATASETS.find((d) => d.key === key) ?? DEMO_DATASETS[0];
}
