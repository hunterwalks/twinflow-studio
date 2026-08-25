"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useProject } from "@/lib/project/ProjectProvider";
import {
  defaultModelConfig,
  validateModelConfig,
} from "@/lib/config/model";
import { buildConfigPackage } from "@/lib/config/rules";
import { BUILTIN_PACKAGE, getEnabledRules } from "@/lib/rules/packages";
import { runRules } from "@/lib/rules/engine";
import { makeDataset } from "@/lib/rules/dataset";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function FieldTypeBadge({ type, refType, enumRef }: { type: string; refType?: string; enumRef?: string }) {
  const hint =
    type === "ref" ? `引用→${refType ?? "?"}` : type === "enum" ? `枚举→${enumRef ?? "?"}` : type;
  return (
    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
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
    const blob = new Blob([JSON.stringify(modelConfig, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "twinflow-model-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="模型配置" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHead title={`当前模型（${modelConfig.objectTypes.length} 个对象类型）`} />
          <div className="space-y-3 p-4">
            {modelConfig.objectTypes.map((ot) => (
              <div key={ot.id} data-testid={`model-type-${ot.id}`} className="rounded-lg border border-line bg-surface-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-1">{ot.label}</span>
                  <span className="text-xs text-ink-4">({ot.id})</span>
                  <span className="text-xs text-ink-4">主键：{ot.keyField}</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs">
                  {ot.fields.map((f) => (
                    <li key={f.key} className="flex items-center gap-2 text-ink-2">
                      <code className="text-ink-1">{f.key}</code>
                      <FieldTypeBadge type={f.type} refType={f.refType} enumRef={f.enumRef} />
                      {f.required && <span className="text-err">必填</span>}
                      {f.unique && <span className="text-warn">唯一</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {modelConfig.enums.length > 0 && (
              <div className="rounded-lg border border-line bg-surface-2 p-3">
                <h3 className="text-xs font-semibold text-ink-2">枚举</h3>
                <ul className="mt-1 space-y-1 text-xs text-ink-2">
                  {modelConfig.enums.map((e) => (
                    <li key={e.id}>
                      <code className="text-ink-1">{e.id}</code>：{e.values.join("、")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="编辑模型配置（JSON）" />
          <div className="p-4">
            <textarea
              data-testid="model-json"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              spellCheck={false}
              className="h-72 w-full resize-y rounded-lg border border-line bg-surface-2 p-2 font-mono text-xs text-ink-1"
            />
            {!valid && (
              <div data-testid="model-errors" className="mt-2 rounded-lg bg-err-bg p-2 text-xs text-err">
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
              <Button data-testid="model-apply" onClick={apply} disabled={!valid}>
                应用配置
              </Button>
              <Button variant="secondary" onClick={resetDefault}>
                重置为默认
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                导入配置
              </Button>
              <Button variant="secondary" onClick={exportConfig}>
                导出配置
              </Button>
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
              <p data-testid="model-applied" className="mt-2 text-xs text-ok">
                配置已应用并保存到本地。
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHead title="规则包与试运行" />
        <div className="flex flex-wrap items-center gap-4 p-4">
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              data-testid="pkg-builtin"
              checked={enabled.builtin}
              onChange={(e) => setEnabled((p) => ({ ...p, builtin: e.target.checked }))}
            />
            内置规则包（24 条）
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input
              type="checkbox"
              data-testid="pkg-config"
              checked={enabled.config}
              onChange={(e) => setEnabled((p) => ({ ...p, config: e.target.checked }))}
            />
            配置驱动规则包（{configPkg.rules.length} 条）
          </label>
          <Button data-testid="model-trial" onClick={runTrial}>
            在已加载数据上试运行
          </Button>
        </div>
        {trial && (
          <div data-testid="model-trial-result" className="mx-4 mb-4 rounded-lg bg-surface-2 p-3 text-sm text-ink-2">
            <div>{trial.message}</div>
            <div className="mt-1 flex gap-4 text-xs">
              <span className="text-err">错误 {trial.error}</span>
              <span className="text-warn">警告 {trial.warning}</span>
              <span className="text-info">提示 {trial.info}</span>
              <span className="text-ink-4">共 {trial.ruleCount} 条规则</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
