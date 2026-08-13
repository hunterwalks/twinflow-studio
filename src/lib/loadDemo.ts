import { industrialPark } from "./data/industrialPark";
import type { IndustrialPark } from "./types";

/**
 * Demo 加载结果：成功 / 空 / 错误 三种确定性状态。
 * v0.1.0 使用合成数据，默认返回 success；view 参数仅用于演示与验证空/错误态。
 */
export type DemoResult =
  | { status: "success"; data: IndustrialPark }
  | { status: "empty" }
  | { status: "error"; message: string };

export function loadDemoData(view?: string | string[] | null): DemoResult {
  // Next.js 的 searchParams 值可能是 string | string[]，归一化为单项字符串。
  const key = Array.isArray(view) ? view[0] : view;
  if (key === "error") {
    return { status: "error", message: "示例数据源读取失败：无法连接合成工业园区数据集。" };
  }
  if (key === "empty") {
    return { status: "empty" };
  }
  return { status: "success", data: industrialPark };
}

/** 对象数量统计（用于 Demo 概览卡片）。 */
export function countObjects(data: IndustrialPark): {
  spaces: number;
  assets: number;
  sensors: number;
  total: number;
} {
  const spaces = data.spaces.length;
  const assets = data.assets.length;
  const sensors = data.sensors.length;
  return { spaces, assets, sensors, total: spaces + assets + sensors };
}
