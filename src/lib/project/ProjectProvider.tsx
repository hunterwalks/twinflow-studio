"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LooseRecord } from "@/lib/rules/types";
import { getDemoDataset } from "@/lib/data/registry";
import type { ProjectState, TableKey } from "./types";
import { EMPTY_PROJECT } from "./types";
import { clearProject, loadProject, saveProject } from "./persist";

interface ProjectContextValue {
  state: ProjectState;
  isEmpty: boolean;
  /** localStorage 不可用时给出原因与恢复动作，否则为 null。 */
  storageWarning: string | null;
  /** 加载示例数据集到项目；不传 key 时加载默认数据集。 */
  loadDemo: (key?: string) => void;
  /** 写入单张表（合并保留其他表）；用于 /import 逐表导入累积成项目。 */
  importTable: (table: TableKey, records: LooseRecord[]) => void;
  clear: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectState>(EMPTY_PROJECT);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  // 仅当用户主动操作后才持久化，避免挂载水合用空态覆盖已存数据。
  const touchedRef = useRef(false);

  // 挂载时水合（不触发保存）
  useEffect(() => {
    const saved = loadProject();
    if (saved) setState(saved);
  }, []);

  // 探测 localStorage 可用性（隐私模式 / 禁用站点数据时会抛错）
  useEffect(() => {
    try {
      const probe = "__twinflow_probe__";
      const s = globalThis.localStorage;
      s.setItem(probe, "1");
      s.removeItem(probe);
      setStorageWarning(null);
    } catch {
      setStorageWarning(
        "当前浏览器禁用了本地存储（localStorage），项目数据将无法在刷新后自动恢复。请检查浏览器的隐私 / 站点设置，或在允许本地存储的浏览器中打开本应用。",
      );
    }
  }, []);

  // 仅在用户动作后保存
  useEffect(() => {
    if (!touchedRef.current) return;
    saveProject(state);
  }, [state]);

  const loadDemo = useCallback((key?: string) => {
    touchedRef.current = true;
    const ds = getDemoDataset(key);
    setState({
      version: 1,
      source: "demo",
      spaces: ds.spaces,
      assets: ds.assets,
      sensors: ds.sensors,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const importTable = useCallback((table: TableKey, records: LooseRecord[]) => {
    touchedRef.current = true;
    setState((prev) => ({
      version: 1,
      source: "import",
      spaces: table === "spaces" ? records : prev.spaces,
      assets: table === "assets" ? records : prev.assets,
      sensors: table === "sensors" ? records : prev.sensors,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const clear = useCallback(() => {
    touchedRef.current = true;
    clearProject();
    setState({ ...EMPTY_PROJECT });
  }, []);

  const isEmpty =
    state.spaces.length === 0 && state.assets.length === 0 && state.sensors.length === 0;

  const value = useMemo<ProjectContextValue>(
    () => ({ state, isEmpty, storageWarning, loadDemo, importTable, clear }),
    [state, isEmpty, storageWarning, loadDemo, importTable, clear],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject 必须在 ProjectProvider 内使用");
  return ctx;
}
