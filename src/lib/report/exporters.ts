/**
 * 报告导出器（v0.6.0）
 *
 * - toJSON：结构化的、key 顺序固定的格式化 JSON，确定可复现，便于归档与二次处理。
 * - toHTML：自包含 HTML（内联样式、可打印、可离线打开），所有动态文本均经 HTML 转义。
 *
 * 两者均为纯函数，无 AI、无网络、无副作用。
 */

import { CATEGORY_LABEL, SEVERITY_LABEL, TABLE_LABEL } from "@/lib/rules/types";
import { traceText } from "@/lib/rules/engine";
import type { TwinFlowReport } from "./types";

/** 导出为格式化 JSON 字符串（key 顺序固定，确定可复现）。 */
export function toJSON(report: TwinFlowReport): string {
  return JSON.stringify(report, null, 2);
}

/** HTML 转义，避免用户数据破坏布局或注入。 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CATEGORY_OF = (c: string): string =>
  c === "custom" ? "自定义" : CATEGORY_LABEL[c as keyof typeof CATEGORY_LABEL] ?? c;

/** 自包含 HTML 报告：内联样式、可打印、可离线打开。 */
export function toHTML(report: TwinFlowReport): string {
  const { meta, validation, quality, recommendations } = report;
  const esc = escapeHtml;

  const dimensionRows = (Object.keys(CATEGORY_LABEL) as Array<keyof typeof CATEGORY_LABEL>)
    .map((c) => {
      const d = quality.byDimension[c];
      return `<tr><td>${esc(CATEGORY_LABEL[c])}</td><td>${Math.round(d.score)}</td><td>${d.issues}</td></tr>`;
    })
    .join("");

  const issueRows = validation.issues
    .map(
      (i) => `<tr>
        <td class="sev-${i.severity}">${esc(SEVERITY_LABEL[i.severity])}</td>
        <td>${esc(TABLE_LABEL[i.table])}</td>
        <td>${esc(traceText(i))}</td>
        <td>${esc(i.field ?? "")}</td>
        <td>${esc(i.message)}</td>
        <td>${esc(i.hint)}</td>
      </tr>`,
    )
    .join("");

  const recRows = recommendations
    .map(
      (r) => `<tr>
        <td>${esc(r.priority)}</td>
        <td>${esc(r.ruleName)}</td>
        <td>${esc(CATEGORY_OF(r.category))}</td>
        <td>${esc(r.kind === "builtin" ? `内置·${r.ruleId ?? ""}` : "自定义")}</td>
        <td>${esc(r.reason)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TwinFlow Studio 数据质量治理报告</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; color: #0f172a; margin: 0; padding: 32px; background: #f8fafc; }
  .page { max-width: 960px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 28px 0 12px; border-left: 4px solid #2563eb; padding-left: 10px; }
  .meta { color: #64748b; font-size: 13px; }
  .score { display: flex; align-items: baseline; gap: 8px; }
  .score .big { font-size: 48px; font-weight: 700; }
  .grade { display: inline-block; padding: 2px 10px; border-radius: 999px; font-weight: 600; background: #ecfdf5; color: #047857; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; }
  .sev-error { color: #dc2626; } .sev-warning { color: #d97706; } .sev-info { color: #0ea5e9; }
  .footer { margin-top: 32px; color: #94a3b8; font-size: 12px; }
  @media print { body { background: #fff; } .page { box-shadow: none; } }
</style>
</head>
<body>
<div class="page">
  <h1>TwinFlow Studio 数据质量治理报告</h1>
  <p class="meta">生成时间：${esc(meta.generatedAt)} · 数据来源：${esc(meta.source)} · 工具版本：${esc(meta.version)}</p>
  <p class="meta">记录数：空间 ${meta.recordCount.spaces} · 设备 ${meta.recordCount.assets} · 测点 ${meta.recordCount.sensors} · 合计 ${meta.recordCount.total}</p>

  <h2>数据质量评分</h2>
  <div class="score"><span class="big">${quality.score}</span><span>/ 100</span><span class="grade">等级 ${quality.grade}</span></div>
  <p class="meta">问题合计 ${validation.totals.all}（错误 ${validation.totals.error} · 警告 ${validation.totals.warning} · 提示 ${validation.totals.info}）</p>
  <table>
    <thead><tr><th>维度</th><th>得分</th><th>问题数</th></tr></thead>
    <tbody>${dimensionRows}</tbody>
  </table>

  <h2>校验汇总</h2>
  <table>
    <thead><tr><th>规则数</th><th>命中规则</th><th>通过规则</th><th>跳过规则</th></tr></thead>
    <tbody><tr><td>${validation.ruleCount}</td><td>${validation.triggeredRuleCount}</td><td>${validation.passedRuleCount}</td><td>${validation.skippedRuleCount}</td></tr></tbody>
  </table>

  <h2>问题清单（${validation.issues.length}）</h2>
  <table>
    <thead><tr><th>级别</th><th>表</th><th>定位</th><th>字段</th><th>描述</th><th>修复建议</th></tr></thead>
    <tbody>${issueRows || '<tr><td colspan="6">无问题</td></tr>'}</tbody>
  </table>

  <h2>规则与治理建议（${recommendations.length}）</h2>
  <table>
    <thead><tr><th>优先级</th><th>建议</th><th>类别</th><th>类型</th><th>原因</th></tr></thead>
    <tbody>${recRows || '<tr><td colspan="5">无建议</td></tr>'}</tbody>
  </table>

  <p class="footer">本报告由 TwinFlow Studio v${esc(meta.version)} 本地生成，确定性、可离线、不含 AI 判断。</p>
</div>
</body>
</html>`;
}
