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
import { industrialPark } from "@/lib/data/industrialPark";
import type { ProjectState, TableKey } from "./types";
import { EMPTY_PROJECT } from "./types";
import { clearProject, loadProject, saveProject } from "./persist";

interface ProjectContextValue {
  state: ProjectState;
  isEmpty: boolean;
  loadDemo: () => void;
  /** 写入单张表（合并保留其他表）；用于 /import 逐表导入累积成项目。 */
  importTable: (table: TableKey, records: LooseRecord[]) => void;
  clear: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

/** 将任意记录数组转为宽松字符串记录（null → ""），对齐模型语义。 */
function toLoose<T extends Record<string, unknown>>(rows: T[]): LooseRecord[] {
  return rows.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, v == null ? "" : String(v)]),
    ),
  ) as LooseRecord[];
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectState>(EMPTY_PROJECT);
  // 仅当用户主动操作后才持久化，避免挂载水合用空态覆盖已存数据。
  const touchedRef = useRef(false);

  // 挂载时水合（不触发保存）
  useEffect(() => {
    const saved = loadProject();
    if (saved) setState(saved);
  }, []);

  // 仅在用户动作后保存
  useEffect(() => {
    if (!touchedRef.current) return;
    saveProject(state);
  }, [state]);

  const loadDemo = useCallback(() => {
    touchedRef.current = true;
    setState({
      version: 1,
      source: "demo",
      spaces: toLoose(industrialPark.spaces),
      assets: toLoose(industrialPark.assets),
      sensors: toLoose(industrialPark.sensors),
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
    () => ({ state, isEmpty, loadDemo, importTable, clear }),
    [state, isEmpty, loadDemo, importTable, clear],
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject 必须在 ProjectProvider 内使用");
  return ctx;
}
