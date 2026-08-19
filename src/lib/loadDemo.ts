import { DEMO_DATASETS, getDemoDataset, type DemoDataset } from "./data/registry";

/**
 * Demo 加载结果：成功 / 空 / 错误 三种确定性状态。
 * v0.7.0 起支持多套合成数据集（工业园区 / 城市基础设施 × 干净 / 含问题），
 * demo 页与 E2E 通过 key 选择；view 参数仅用于演示与验证空/错误态。
 */
export type DemoData = DemoDataset;

export type DemoResult =
  | { status: "success"; data: DemoDataset }
  | { status: "empty" }
  | { status: "error"; message: string };

export function loadDemoData(view?: string | string[] | null): DemoResult {
  // Next.js 的 searchParams 值可能是 string | string[]，归一化为单项字符串。
  const key = Array.isArray(view) ? view[0] : view;
  if (key === "error") {
    return { status: "error", message: "示例数据源读取失败：无法连接合成数据集。" };
  }
  if (key === "empty") {
    return { status: "empty" };
  }
  const ds = DEMO_DATASETS.some((d) => d.key === key) ? getDemoDataset(key) : getDemoDataset();
  return { status: "success", data: ds };
}

/** 对象数量统计（用于 Demo 概览卡片）。 */
export function countObjects(data: DemoData): {
  spaces: number;
  assets: number;
  sensors: number;
  observations: number;
  total: number;
} {
  const spaces = data.spaces.length;
  const assets = data.assets.length;
  const sensors = data.sensors.length;
  const observations = data.observations.length;
  return { spaces, assets, sensors, observations, total: spaces + assets + sensors + observations };
}
