import Link from "next/link";

const STEPS = [
  { n: 1, title: "打开 Demo", desc: "一键载入合成数据集，立刻看到 Space / Asset / Sensor 三类对象。" },
  { n: 2, title: "校验质量", desc: "运行 15 条确定性规则，查看分级且可溯源的问题清单与质量评分。" },
  { n: 3, title: "看关系图", desc: "在关系图中查看层级与引用，孤立或悬空对象会被高亮标注原因。" },
  { n: 4, title: "导入你的表", desc: "选择本地 CSV / Excel，映射字段并即时校验，全程不上传。" },
  { n: 5, title: "导出报告", desc: "一键生成自包含 HTML / JSON 治理报告，可离线打开与归档。" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-brand-600">TwinFlow Studio · v0.7.0</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        数字孪生数据建模与质量治理工作台
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Local-first、AI-assisted 的工作台，帮助你在项目早期从表格资产中识别业务对象、
        建立空间与设备关系、检查数据质量并形成可追溯的治理报告。
      </p>

      {/* 新手引导：5 步上手 */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" data-testid="home-onboarding">
        <h2 className="text-lg font-semibold text-slate-800">5 步上手</h2>
        <ol className="mt-4 space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-800">{s.title}</p>
                <p className="text-sm text-slate-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/demo"
          data-testid="home-open-demo"
          className="mt-5 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          从 Demo 开始 →
        </Link>
      </section>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">导入你的表格数据</h2>
        <p className="mt-2 text-sm text-slate-500">
          选择本地 CSV / Excel 文件，预览工作表并把列映射到 Space / Asset / Sensor 模型字段，
          导入后立即得到通过计数与逐行错误。全程在浏览器本地完成，不上传文件。
        </p>
        <Link
          href="/import"
          data-testid="home-open-import"
          className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          导入数据 →
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">校验数据质量</h2>
        <p className="mt-2 text-sm text-slate-500">
          对内置 Demo 或含问题样例运行 15 条确定性校验规则，得到分级（错误 / 警告 / 提示）
          且可溯源（表 / 行号 / 记录 ID / 字段）的问题清单，每条问题附带修复建议。
        </p>
        <Link
          href="/validate"
          data-testid="home-open-validate"
          className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          校验数据 →
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">可视化对象关系图</h2>
        <p className="mt-2 text-sm text-slate-500">
          以关系图查看 Space / Asset / Sensor 的层级与引用结构，孤立或悬空对象会被高亮并标注原因；
          当前项目会自动保存在浏览器本地，关闭重开后自动恢复。
        </p>
        <Link
          href="/graph"
          data-testid="home-open-graph"
          className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          查看关系图 →
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">导出数据治理报告</h2>
        <p className="mt-2 text-sm text-slate-500">
          基于当前项目数据聚合校验问题、质量评分（0–100 / 等级 A–E）与规则建议，一键导出为
          自包含 HTML（可打印、可离线打开）或结构化 JSON（便于归档与二次处理）。全部在浏览器本地生成，不上传数据。
        </p>
        <Link
          href="/report"
          data-testid="home-open-report"
          className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          导出报告 →
        </Link>
      </div>

      {/* 本地优先与隐私说明 */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600" data-testid="home-privacy">
        <h2 className="font-semibold text-slate-800">数据在本地处理</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>所有 CSV / Excel 解析、校验与报告生成都在你的浏览器内完成，不会上传到任何业务后端。</li>
          <li>当前项目会自动保存在浏览器本地存储（localStorage），刷新或重开页面后会自动恢复。</li>
          <li>想清空本地数据：进入「关系图」页点击「清空项目」，或在浏览器设置中清除本站数据。</li>
        </ul>
      </section>

      <p className="mt-10 text-xs text-slate-400">
        当前为 v0.7.0：在 v0.6.0 报告导出之上，新增公开静态托管（GitHub Pages）、Playwright E2E、
        新手引导与错误恢复、两套城市基础设施合成数据、ESLint CLI 与 CI 质量门。全部为纯函数、可离线、可测试，无外部 AI 依赖。
      </p>
    </main>
  );
}
