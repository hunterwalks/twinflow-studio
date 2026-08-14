import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-brand-600">TwinFlow Studio · v0.5.0</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        数字孪生数据建模与质量治理工作台
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Local-first、AI-assisted 的工作台，帮助你在项目早期从表格资产中识别业务对象、
        建立空间与设备关系、检查数据质量并形成可追溯的治理报告。
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">内置合成工业园区 Demo</h2>
        <p className="mt-2 text-sm text-slate-500">
          无需任何配置，直接打开一份合成的工业园区数据集，查看 Space / Asset / Sensor 三类对象与数据预览。
        </p>
        <Link
          href="/demo"
          className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          打开 Demo →
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">导入你的表格数据</h2>
        <p className="mt-2 text-sm text-slate-500">
          选择本地 CSV / Excel 文件，预览工作表并把列映射到 Space / Asset / Sensor 模型字段，
          导入后立即得到通过计数与逐行错误。全程在浏览器本地完成，不上传文件。
        </p>
        <Link
          href="/import"
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
          className="mt-4 inline-flex items-center rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          查看关系图 →
        </Link>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        当前为 v0.5.0：在 v0.4.0 对象关系图与项目保存恢复之上，新增确定性字段映射建议（置信度打分 +
        模糊匹配）、数据质量评分（0–100 / 等级 A–E）与规则 / 治理建议。全部为纯函数、可离线、可测试，
        无外部 AI 依赖。报告导出将在 v0.6.0 开放。
      </p>
    </main>
  );
}
