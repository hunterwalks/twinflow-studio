"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/project/ProjectProvider";
import { industrialPark } from "@/lib/data/industrialPark";
import { messyPark, rootlessSpaces } from "@/lib/data/messyPark";
import { cityInfraClean } from "@/lib/data/cityInfraClean";
import { cityInfraProblem } from "@/lib/data/cityInfraProblem";
import { toRuleDataset } from "@/lib/rules/dataset";
import type { RuleDataset } from "@/lib/rules/types";
import {
  betterLabel,
  compareProjects,
  profileDataset,
  type CompareRow,
  type ProjectProfile,
} from "@/lib/compare";

interface StaticOption {
  key: string;
  label: string;
  dataset: RuleDataset;
}

const CURRENT_KEY = "current";
const STATIC_OPTIONS: StaticOption[] = [
  { key: "demo", label: "内置 Demo（工业园区）", dataset: toRuleDataset(industrialPark) },
  { key: "city-clean", label: "城市基础设施（干净）", dataset: cityInfraClean },
  { key: "messy", label: "含问题样例", dataset: messyPark },
  { key: "city-problem", label: "城市基础设施（含问题）", dataset: cityInfraProblem },
  { key: "rootless", label: "无根空间样例", dataset: rootlessSpaces },
];
const ALL_KEYS = [CURRENT_KEY, ...STATIC_OPTIONS.map((o) => o.key)];

const EMPTY_DATASET: RuleDataset = { spaces: [], assets: [], sensors: [], observations: [] };

function optionLabel(key: string): string {
  if (key === CURRENT_KEY) return "当前项目";
  return STATIC_OPTIONS.find((o) => o.key === key)?.label ?? key;
}

/** 结果单元格：数值高亮更优方。 */
function valueCell(row: CompareRow, side: "left" | "right") {
  const value = side === "left" ? row.left : row.right;
  const better = row.better;
  const highlight = row.better !== "na" && better === side;
  return highlight ? (
    <span className="font-semibold text-emerald-700">{value}</span>
  ) : (
    <span>{value}</span>
  );
}

export default function ComparePage() {
  const { state } = useProject();
  const [keyA, setKeyA] = useState("city-clean");
  const [keyB, setKeyB] = useState("messy");

  const currentDataset = useMemo<RuleDataset>(
    () => ({
      spaces: state.spaces,
      assets: state.assets,
      sensors: state.sensors,
      observations: state.observations,
    }),
    [state],
  );

  const { profileA, profileB, rows } = useMemo(() => {
    const resolve = (key: string): ProjectProfile => {
      if (key === CURRENT_KEY) return profileDataset("当前项目", currentDataset);
      const opt = STATIC_OPTIONS.find((o) => o.key === key);
      return opt ? profileDataset(opt.label, opt.dataset) : profileDataset(optionLabel(key), EMPTY_DATASET);
    };
    const a = resolve(keyA);
    const b = resolve(keyB);
    return { profileA: a, profileB: b, rows: compareProjects(a, b) };
  }, [keyA, keyB, currentDataset]);

  function select(key: string, side: "A" | "B") {
    if (side === "A") setKeyA(key);
    else setKeyB(key);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">TwinFlow Studio · 跨项目对比</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            并排对比两个项目的治理成效
          </h1>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← 返回首页
        </Link>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        左侧与右侧各选一个项目（当前项目或内置样例），按记录规模、质量评分（0–100）、
        问题分布与规则命中情况逐项对比。全部在浏览器本地计算，不上传数据。
      </p>

      {/* 选择器 */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
          <span className="font-medium text-slate-700">左侧项目（A）</span>
          <select
            data-testid="compare-select-a"
            value={keyA}
            onChange={(e) => select(e.target.value, "A")}
            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            {ALL_KEYS.map((k) => (
              <option key={k} value={k}>
                {optionLabel(k)}
              </option>
            ))}
          </select>
        </label>
        <label className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
          <span className="font-medium text-slate-700">右侧项目（B）</span>
          <select
            data-testid="compare-select-b"
            value={keyB}
            onChange={(e) => select(e.target.value, "B")}
            className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            {ALL_KEYS.map((k) => (
              <option key={k} value={k}>
                {optionLabel(k)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 对比表 */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table data-testid="compare-table" className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-b border-slate-200 px-4 py-2 font-medium text-slate-500">指标</th>
              <th className="border-b border-slate-200 px-4 py-2 font-medium text-slate-700">
                A · {optionLabel(keyA)}
              </th>
              <th className="border-b border-slate-200 px-4 py-2 font-medium text-slate-700">
                B · {optionLabel(keyB)}
              </th>
              <th className="border-b border-slate-200 px-4 py-2 font-medium text-slate-500">结果</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="align-top hover:bg-slate-50">
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-slate-700">
                  {row.label}
                  {row.hint && (
                    <p className="mt-0.5 text-xs text-slate-400">{row.hint}</p>
                  )}
                </td>
                <td className="border-b border-slate-100 px-4 py-2 font-mono text-slate-600">
                  {valueCell(row, "left")}
                </td>
                <td className="border-b border-slate-100 px-4 py-2 font-mono text-slate-600">
                  {valueCell(row, "right")}
                </td>
                <td className="whitespace-nowrap border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                  {betterLabel(row.better)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top 规则对比 */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            A · {optionLabel(keyA)} · 主要问题规则
          </h2>
          <ul data-testid="compare-toprules-a" className="mt-3 space-y-1.5 text-sm text-slate-600">
            {profileA.topRules.length === 0 ? (
              <li className="text-slate-400">无命中规则。</li>
            ) : (
              profileA.topRules.map((r) => (
                <li key={r.ruleId} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{r.ruleId}</span>
                  <span>{r.ruleName}</span>
                  <span className="ml-auto rounded bg-slate-100 px-1.5 text-xs text-slate-500">× {r.count}</span>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">
            B · {optionLabel(keyB)} · 主要问题规则
          </h2>
          <ul data-testid="compare-toprules-b" className="mt-3 space-y-1.5 text-sm text-slate-600">
            {profileB.topRules.length === 0 ? (
              <li className="text-slate-400">无命中规则。</li>
            ) : (
              profileB.topRules.map((r) => (
                <li key={r.ruleId} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{r.ruleId}</span>
                  <span>{r.ruleName}</span>
                  <span className="ml-auto rounded bg-slate-100 px-1.5 text-xs text-slate-500">× {r.count}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        对比口径：质量评分 0–100（越高越好）；错误 / 警告 / 提示与问题总数（越少越好）；
        命中规则数（越少越好）；通过规则数（越多越好）；跳过规则数为信息性指标，不参与优劣判定。
      </p>
    </main>
  );
}
