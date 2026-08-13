import type { ProjectState } from "./types";
import { EMPTY_PROJECT } from "./types";

const STORAGE_KEY = "twinflow-project-v1";

/** 在 SSR / 隐私模式下安全获取 localStorage，不可用则返回 null。 */
function storage(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && (globalThis as { localStorage?: Storage }).localStorage) {
      return (globalThis as { localStorage: Storage }).localStorage;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 从 localStorage 水合项目；解析失败或版本不符返回 null（不抛错）。 */
export function loadProject(): ProjectState | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProjectState>;
    if (!parsed || parsed.version !== 1) return null;
    return {
      version: 1,
      source: parsed.source === "demo" || parsed.source === "import" ? parsed.source : "empty",
      spaces: Array.isArray(parsed.spaces) ? parsed.spaces : [],
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      sensors: Array.isArray(parsed.sensors) ? parsed.sensors : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
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
