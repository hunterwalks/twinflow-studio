import type { LooseRecord } from "@/lib/rules/types";
import type { ProjectMetadata, ProjectState, ProjectSource } from "./types";
import { migrateProjectV1ToV2 } from "./persist";
import { APP_VERSION } from "@/lib/version";

/**
 * 项目 JSON 文件的导入 / 导出（v0.8.0）
 *
 * 设计要点：
 * - 导出：在 ProjectState 之外包一层元信息外壳（format / formatVersion / appVersion /
 *   exportedAt / name），便于归档与版本识别，同时保留可被其它工具识别的结构。
 * - 导入：兼容「带外壳」与「裸 ProjectState」两种形态，并支持 v1（三表）→ v2（四表）
 *   自动迁移。所有解析与校验均为纯函数、确定性，便于单元测试。
 * - 覆盖式写入：导入即整体替换当前项目，不合并；合并导入请使用 /import 逐表流程。
 */

export const PROJECT_FILE_FORMAT = "twinflow-project";
export const PROJECT_FILE_FORMAT_VERSION = 2;

/** 项目文件外壳。 */
export interface ProjectFile {
  format: typeof PROJECT_FILE_FORMAT;
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  name?: string;
  project: ProjectState;
}

export interface ParseProjectResult {
  state: ProjectState;
  /** 解析 / 迁移过程中产生的人类可读提示（非致命）。 */
  warnings: string[];
}

function asRecordArray(v: unknown): LooseRecord[] | null {
  if (!Array.isArray(v)) return null;
  return v.filter((r) => r != null && typeof r === "object") as LooseRecord[];
}

/** 将项目状态序列化为可下载的 JSON 字符串（含元信息外壳）。纯函数。 */
export function serializeProject(state: ProjectState, opts?: { name?: string }): string {
  const file: ProjectFile = {
    format: PROJECT_FILE_FORMAT,
    formatVersion: PROJECT_FILE_FORMAT_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    name: opts?.name,
    project: state,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * 解析项目 JSON 文件内容。
 * 兼容：带外壳对象、裸 ProjectState、v1（三表）与 v2（四表）。
 * 解析失败时抛出可读错误；部分字段缺失/畸形时按空表处理并附 warnings。
 */
export function parseProjectFile(content: string): ParseProjectResult {
  const warnings: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error("项目文件不是合法的 JSON。");
  }
  if (raw == null || typeof raw !== "object") {
    throw new Error("项目文件内容格式不正确（应为对象）。");
  }
  const obj = raw as Record<string, unknown>;
  // 兼容「带外壳」与「裸 ProjectState」两种形态
  const candidate =
    obj.project != null && typeof obj.project === "object"
      ? (obj.project as Record<string, unknown>)
      : obj;

  const version = candidate.version;
  if (typeof version !== "number") {
    throw new Error("无法识别的项目文件：缺少 version 字段。");
  }

  if (version === 1) {
    warnings.push("检测到 v1 项目文件，已自动迁移为 v2（四表）格式，观测表为空。");
    const migrated = migrateProjectV1ToV2(candidate as never);
    return { state: migrated, warnings };
  }

  if (version === 2) {
    const source: ProjectSource =
      candidate.source === "demo" ||
      candidate.source === "import" ||
      candidate.source === "project"
        ? (candidate.source as ProjectSource)
        : "empty";
    const spaces = asRecordArray(candidate.spaces);
    const assets = asRecordArray(candidate.assets);
    const sensors = asRecordArray(candidate.sensors);
    const observations = asRecordArray(candidate.observations);
    if (spaces === null) warnings.push("spaces 字段缺失或非数组，已按空表处理。");
    if (assets === null) warnings.push("assets 字段缺失或非数组，已按空表处理。");
    if (sensors === null) warnings.push("sensors 字段缺失或非数组，已按空表处理。");
    if (observations === null) warnings.push("observations 字段缺失或非数组，已按空表处理。");
    const state: ProjectState = {
      version: 2,
      source,
      spaces: spaces ?? [],
      assets: assets ?? [],
      sensors: sensors ?? [],
      observations: observations ?? [],
      metadata: isMetadata(candidate.metadata),
      updatedAt:
        typeof candidate.updatedAt === "string"
          ? candidate.updatedAt
          : new Date().toISOString(),
    };
    return { state, warnings };
  }

  throw new Error(`不支持的项目文件版本：v${version}。`);
}

/** 宽松校验元信息形状；不合法时返回 undefined（按未设置处理）。 */
function isMetadata(v: unknown): ProjectMetadata | undefined {
  if (v == null || typeof v !== "object") return undefined;
  const m = v as Partial<ProjectMetadata>;
  const asStr = (x: unknown) => (typeof x === "string" ? x : "");
  return {
    name: asStr(m.name),
    description: asStr(m.description),
    owner: asStr(m.owner),
  };
}
