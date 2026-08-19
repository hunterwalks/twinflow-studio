import type { LooseRecord } from "@/lib/rules/types";
import type { ProjectState, ProjectSource } from "./types";
import { EMPTY_PROJECT } from "./types";

const STORAGE_KEY = "twinflow-project-v1";

/** 在 SSR / 隐私模式下安全获取 localStorage，不可用则返回 null。 */
function storage(): Storage | null {
  try {
    if (
      typeof globalThis !== "undefined" &&
      (globalThis as { localStorage?: Storage }).localStorage
    ) {
      return (globalThis as { localStorage: Storage }).localStorage;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** v1 项目（三表）向 v2（四表）迁移：补齐空的 observations，保留其余字段。 */
export function migrateProjectV1ToV2(v1: {
  source?: unknown;
  spaces?: unknown;
  assets?: unknown;
  sensors?: unknown;
  updatedAt?: unknown;
}): ProjectState {
  const asArr = (v: unknown): LooseRecord[] => (Array.isArray(v) ? (v as LooseRecord[]) : []);
  const source: ProjectSource =
    v1.source === "demo" || v1.source === "import" || v1.source === "project"
      ? (v1.source as ProjectSource)
      : "empty";
  return {
    version: 2,
    source,
    spaces: asArr(v1.spaces),
    assets: asArr(v1.assets),
    sensors: asArr(v1.sensors),
    observations: [],
    updatedAt: typeof v1.updatedAt === "string" ? v1.updatedAt : "",
  };
}

/** 从 localStorage 水合项目；解析失败返回 null（不抛错）。自动迁移 v1 → v2。 */
export function loadProject(): ProjectState | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      version?: number;
      source?: unknown;
      spaces?: unknown;
      assets?: unknown;
      sensors?: unknown;
      observations?: unknown;
      updatedAt?: unknown;
    };
    if (!parsed || typeof parsed.version !== "number") return null;
    if (parsed.version === 1) return migrateProjectV1ToV2(parsed);
    if (parsed.version === 2) {
      const source: ProjectSource =
        parsed.source === "demo" || parsed.source === "import" || parsed.source === "project"
          ? (parsed.source as ProjectSource)
          : "empty";
      return {
        version: 2,
        source,
        spaces: Array.isArray(parsed.spaces) ? (parsed.spaces as LooseRecord[]) : [],
        assets: Array.isArray(parsed.assets) ? (parsed.assets as LooseRecord[]) : [],
        sensors: Array.isArray(parsed.sensors) ? (parsed.sensors as LooseRecord[]) : [],
        observations: Array.isArray(parsed.observations)
          ? (parsed.observations as LooseRecord[])
          : [],
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** 持久化项目；写入失败（隐私模式 / 配额）静默降级，不影响应用。 */
export function saveProject(state: ProjectState): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 静默降级 */
  }
}

/** 清除持久化项目。 */
export function clearProject(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export { EMPTY_PROJECT };
