"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useProject } from "@/lib/project/ProjectProvider";
import {
  defaultModelConfig,
  validateModelConfig,
} from "@/lib/config/model";
import { buildConfigPackage } from "@/lib/config/rules";
import { BUILTIN_PACKAGE, getEnabledRules } from "@/lib/rules/packages";
import { runRules } from "@/lib/rules/engine";
import { makeDataset } from "@/lib/rules/dataset";

function FieldTypeBadge({ type, refType, enumRef }: { type: string; refType?: string; enumRef?: string }) {
  const hint =
    type === "ref" ? `引用→${refType ?? "?"}` : type === "enum" ? `枚举→${enumRef ?? "?"}` : type;
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
      {hint}
    </span>
  );
}

export default function ModelPage() {
  const { modelConfig, setModelConfig, state, isEmpty } = useProject();
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ path: string; message: string }[]>([]);
  const [valid, setValid] = useState(true);
  const [applied, setApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 初始与配置被外部重置时同步编辑框
  useEffect(() => {
    setText(JSON.stringify(modelConfig, null, 2));
  }, [modelConfig]);

  const onTextChange = (next: string) => {
    setText(next);
    setApplied(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(next);
    } catch {
      setValid(false);
      setErrors([{ path: "(root)", message: "JSON 解析失败：请检查括号、引号与逗号" }]);
      return;
    }
    const res = validateModelConfig(parsed);
    setValid(res.ok);
    setErrors(res.errors);
  };

  const apply = () => {
    const res = validateModelConfig(text ? JSON.parse(text) : null);
    if (!res.ok || !res.config) {
      setValid(false);
      setErrors(res.errors);
      return;
    }
    setModelConfig(res.config);
    setApplied(true);
  };

  const resetDefault = () => {
    const def = defaultModelConfig();
    setModelConfig(def);
    setText(JSON.stringify(def, null, 2));
    setApplied(true);
    setErrors([]);
    setValid(true);
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      onTextChange(content);
    };
    reader.readAsText(file);
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(modelConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "twinflow-model-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 规则包试运行
  const [enabled, setEnabled] = useState<{ builtin: boolean; config: boolean }>({
    builtin: true,
    config: true,
  });
  const [trial, setTrial] = useState<{
    error: number;
    warning: number;
    info: number;
    ruleCount: number;
    message: string;
  } | null>(null);

  const configPkg = useMemo(() => buildConfigPackage(modelConfig), [modelConfig]);

  const runTrial = () => {
    if (isEmpty) {
      setTrial({ error: 0, warning: 0, info: 0, ruleCount: 0, message: "当前没有已加载的数据，请先导入或载入 Demo。" });
      return;
    }
    const dataset = makeDataset({
      spaces: state.spaces,
      assets: state.assets,
      sensors: state.sensors,
      observations: state.observations,
    });
    const ids: string[] = [];
    if (enabled.builtin) ids.push("builtin");
    if (enabled.config) ids.push("config");
    const rules = getEnabledRules([BUILTIN_PACKAGE, configPkg], ids);
    const report = runRules(dataset, rules);
    setTrial({
      error: report.totals.error,
      warning: report.totals.warning,
      info: report.totals.info,
      ruleCount: report.ruleCount,
      message: `已对当前数据运行 ${report.ruleCount} 条规则。`,
    });
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Breadcrumbs items={[{ href: "/model", label: "模型" }]} />
      <h1 className="text-2xl font-semibold text-slate-900">模型配置</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        可配置对象模型（v1.1.0）：对象类型、字段、枚举与关系。配置作为校验引擎「配置驱动规则」的单一事实来源。
        自定义（第 5+）对象类型可在下方查看、编辑与导出，其端到端校验将在后续版本提供。
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 可读视图 */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">当前模型（{modelConfig.objectTypes.length} 个对象类型）</h2>
          <div className="mt-3 space-y-4">
            {modelConfig.objectTypes.map((ot) => (
              <div key={ot.id} data-testid={`model-type-${ot.id}`} className="rounded border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{ot.label}</span>
                  <span className="text-xs text-slate-400">({ot.id})</span>
                  <span className="text-xs text-slate-400">主键：{ot.keyField}</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  {ot.fields.map((f) => (
                    <li key={f.key} className="flex items-center gap-2 text-slate-600">
                      <code className="text-slate-800">{f.key}</code>
                      <FieldTypeBadge type={f.type} refType={f.refType} enumRef={f.enumRef} />
                      {f.required && <span className="text-rose-500">必填</span>}
                      {f.unique && <span className="text-amber-500">唯一</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {modelConfig.enums.length > 0 && (
              <div className="rounded border border-slate-100 bg-slate-50 p-3">
                <h3 className="text-xs font-semibold text-slate-700">枚举</h3>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {modelConfig.enums.map((e) => (
                    <li key={e.id}>
                      <code className="text-slate-800">{e.id}</code>：{e.values.join("、")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* JSON 编辑 */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-800">编辑模型配置（JSON）</h2>
          <textarea
            data-testid="model-json"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            spellCheck={false}
            className="mt-2 h-72 w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-800"
          />
          {!valid && (
            <div data-testid="model-errors" className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-700">
              <div className="font-medium">校验未通过：</div>
              <ul className="mt-1 list-inside list-disc">
                {errors.slice(0, 8).map((e, i) => (
                  <li key={i}>
                    <code>{e.path}</code> — {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              data-testid="model-apply"
              onClick={apply}
              disabled={!valid}
              className="rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              应用配置
            </button>
            <button
              onClick={resetDefault}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            >
              重置为默认
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            >
              导入配置
            </button>
            <button
              onClick={exportConfig}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            >
              导出配置
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile(f);
                e.target.value = "";
              }}
            />
          </div>
          {applied && valid && (
            <p data-testid="model-applied" className="mt-2 text-xs text-emerald-600">
              配置已应用并保存到本地。
            </p>
          )}
        </section>
      </div>

      {/* 规则包与试运行 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">规则包与试运行</h2>
        <p className="mt-1 text-xs text-slate-500">
          关闭「内置规则包」后，校验将完全由上方模型配置驱动（通用规则：必填 / 枚举 / 引用 / 唯一）。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              data-testid="pkg-builtin"
              checked={enabled.builtin}
              onChange={(e) => setEnabled((p) => ({ ...p, builtin: e.target.checked }))}
            />
            内置规则包（24 条）
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              data-testid="pkg-config"
              checked={enabled.config}
              onChange={(e) => setEnabled((p) => ({ ...p, config: e.target.checked }))}
            />
            配置驱动规则包（{configPkg.rules.length} 条）
          </label>
          <button
            data-testid="model-trial"
            onClick={runTrial}
            className="rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            在已加载数据上试运行
          </button>
        </div>
        {trial && (
          <div data-testid="model-trial-result" className="mt-3 rounded bg-slate-50 p-3 text-sm text-slate-700">
            <div>{trial.message}</div>
            <div className="mt-1 flex gap-4 text-xs">
              <span className="text-rose-600">错误 {trial.error}</span>
              <span className="text-amber-600">警告 {trial.warning}</span>
              <span className="text-sky-600">提示 {trial.info}</span>
              <span className="text-slate-400">共 {trial.ruleCount} 条规则</span>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
