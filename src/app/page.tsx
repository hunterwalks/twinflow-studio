import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-brand-600">TwinFlow Studio · v0.1.0</p>
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

      <p className="mt-10 text-xs text-slate-400">
        当前为 v0.1.0 骨架版本：应用底座 + 合成数据 + 数据预览 + 测试底座。文件导入、AI 建议与关系图将在后续版本逐步开放。
      </p>
    </main>
  );
}
