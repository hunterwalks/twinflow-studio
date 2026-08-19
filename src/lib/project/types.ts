import type { LooseRecord } from "@/lib/rules/types";

/** 四张表对应的键（复数，与数据数组字段一致）。 */
export type TableKey = "spaces" | "assets" | "sensors" | "observations";

/** 项目来源：空 / 内置 Demo / 导入单表 / 导入项目文件。 */
export type ProjectSource = "empty" | "demo" | "import" | "project";

/**
 * 统一项目状态（v0.8.0 升为 version 2，在三表之上新增 observations 第四表）。
 * 可序列化为 localStorage。数据以宽松记录（Record<string,string>）保存，直接对接校验引擎与关系图。
 */
export interface ProjectState {
  version: 2;
  source: ProjectSource;
  spaces: LooseRecord[];
  assets: LooseRecord[];
  sensors: LooseRecord[];
  observations: LooseRecord[];
  /** 最近更新时间（ISO 字符串），空态为 ""。 */
  updatedAt: string;
}

export const EMPTY_PROJECT: ProjectState = {
  version: 2,
  source: "empty",
  spaces: [],
  assets: [],
  sensors: [],
  observations: [],
  updatedAt: "",
};
