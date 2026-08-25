"use client";

import { useMemo, useState } from "react";
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
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead } from "@/components/ui/Card";

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

function valueCell(row: CompareRow, side: "left" | "right") {
  const value = side === "left" ? row.left : row.right;
  const highlight = row.better !== "na" && row.better === side;
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="跨项目对比" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHead title="左侧项目（A）" />
          <div className="p-4">
            <select
              data-testid="compare-select-a"
              value={keyA}
              onChange={(e) => select(e.target.value, "A")}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-1"
            >
              {ALL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {optionLabel(k)}
                </option>
              ))}
            </select>
          </div>
        </Card>
        <Card>
          <CardHead title="右侧项目（B）" />
          <div className="p-4">
            <select
              data-testid="compare-select-b"
              value={keyB}
              onChange={(e) => select(e.target.value, "B")}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-1"
            >
              {ALL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {optionLabel(k)}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardHead title="治理成效对比" meta={`A · ${optionLabel(keyA)} 对比 B · ${optionLabel(keyB)}`} />
        <div className="overflow-x-auto p-4">
          <table data-testid="compare-table" className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-3">
                <th className="px-4 py-2 font-medium">指标</th>
                <th className="px-4 py-2 font-medium text-ink-1">A · {optionLabel(keyA)}</th>
                <th className="px-4 py-2 font-medium text-ink-1">B · {optionLabel(keyB)}</th>
                <th className="px-4 py-2 font-medium">结果</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-line/60 align-top hover:bg-surface-2">
                  <td className="whitespace-nowrap px-4 py-2 text-ink-1">
                    {row.label}
                    {row.hint && <p className="mt-0.5 text-xs text-ink-3">{row.hint}</p>}
                  </td>
                  <td className="px-4 py-2 font-mono text-ink-2">{valueCell(row, "left")}</td>
                  <td className="px-4 py-2 font-mono text-ink-2">{valueCell(row, "right")}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-ink-3">{betterLabel(row.better)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHead title={`A · ${optionLabel(keyA)} · 主要问题规则`} />
          <ul data-testid="compare-toprules-a" className="space-y-1.5 p-4 text-sm text-ink-2">
            {profileA.topRules.length === 0 ? (
              <li className="text-ink-3">无命中规则。</li>
            ) : (
              profileA.topRules.map((r) => (
                <li key={r.ruleId} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-4">{r.ruleId}</span>
                  <span>{r.ruleName}</span>
                  <span className="ml-auto rounded bg-surface-2 px-1.5 text-xs text-ink-3">× {r.count}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
        <Card>
          <CardHead title={`B · ${optionLabel(keyB)} · 主要问题规则`} />
          <ul data-testid="compare-toprules-b" className="space-y-1.5 p-4 text-sm text-ink-2">
            {profileB.topRules.length === 0 ? (
              <li className="text-ink-3">无命中规则。</li>
            ) : (
              profileB.topRules.map((r) => (
                <li key={r.ruleId} className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-4">{r.ruleId}</span>
                  <span>{r.ruleName}</span>
                  <span className="ml-auto rounded bg-surface-2 px-1.5 text-xs text-ink-3">× {r.count}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
