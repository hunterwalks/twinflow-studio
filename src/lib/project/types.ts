import type { LooseRecord } from "@/lib/rules/types";

/** 四张表对应的键（复数，与数据数组字段一致）。 */
export type TableKey = "spaces" | "assets" | "sensors" | "observations";

/** 项目来源：空 / 内置 Demo / 导入单表 / 导入项目文件。 */
export type ProjectSource = "empty" | "demo" | "import" | "project";

/** 项目元信息（v0.9.0 起，可选；用于归档标识与跨表检索展示）。 */
export interface ProjectMetadata {
  name: string;
  description: string;
  owner: string;
}

/** 空元信息（未设置时的等价形态）。 */
export const EMPTY_METADATA: ProjectMetadata = { name: "", description: "", owner: "" };

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
  /** 项目元信息（可选；旧存档 / 旧导入文件中不存在）。 */
  metadata?: ProjectMetadata;
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
