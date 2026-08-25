import Link from "next/link";
import { APP_VERSION } from "@/lib/version";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

/**
 * 离线帮助页（v1.0.0）：快速开始、隐私与安全、常见问题。
 * 纯静态内容，不依赖网络；可在无 AI、无后端的浏览器环境中完整阅读。
 * v1.5.0 起，所有功能性辅助说明统一承载于本页（其它功能页不再内置引导性文字）。
 */
export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow={`TwinFlow Studio · 离线帮助 · v${APP_VERSION}`}
        title="离线帮助与常见问题"
      />

      <Card data-testid="help-quickstart" className="p-6">
        <h2 className="text-lg font-semibold text-ink-1">快速开始</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-2">
          <li>
            1. 打开 <Link href="/demo" className="text-brand-600 hover:underline">Demo</Link>，
            一键载入内置合成园区数据，立即看到 Space / Asset / Sensor / Observation 四类对象。
          </li>
          <li>
            2. 进入 <Link href="/validate" className="text-brand-600 hover:underline">校验</Link>，
            运行 24 条确定性规则，查看分级（错误 / 警告 / 提示）且可溯源的问题清单与质量评分。
          </li>
          <li>
            3. 在 <Link href="/validate" className="text-brand-600 hover:underline">校验</Link> 页对可修复问题点击「应用修复」，
            系统生成 before→after 预览并即时复检，不覆盖你的原始输入文件。
          </li>
          <li>
            4. 用 <Link href="/import" className="text-brand-600 hover:underline">导入</Link> 选择本地 CSV / Excel，
            把列映射到四表模型字段，导入后立即得到通过计数与逐行错误。
          </li>
          <li>
            5. 在 <Link href="/project" className="text-brand-600 hover:underline">项目</Link> 页编辑项目元信息、跨表检索，
            并整体导出为单个 JSON 文件在任意设备恢复。
          </li>
          <li>
            6. 从 <Link href="/report" className="text-brand-600 hover:underline">报告</Link> 导出自包含 HTML / JSON 治理报告，
            或用 <Link href="/compare" className="text-brand-600 hover:underline">对比</Link> 评估治理成效。
          </li>
        </ol>
      </Card>

      <Card data-testid="help-privacy" className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink-1">隐私与安全</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-2">
          <li>
            <span className="font-medium text-ink-1">本地优先（Local-first）：</span>
            所有 CSV / Excel 解析、字段映射、规则校验、修复与报告生成都在你的浏览器内完成，
            不会上传到任何业务后端或第三方服务。
          </li>
          <li>
            <span className="font-medium text-ink-1">无 AI 依赖：</span>
            核心功能为确定性纯函数，无需配置任何 API Key 即可完整使用；本产品不内置会外发数据的 AI 调用。
          </li>
          <li>
            <span className="font-medium text-ink-1">本地存储：</span>
            当前项目自动保存在浏览器本地存储（localStorage，键名 <code className="rounded bg-surface-2 px-1">twinflow-project-v1</code>），
            刷新或重开页面后自动恢复。数据仅存于本机浏览器，不会离开设备。
          </li>
          <li>
            <span className="font-medium text-ink-1">清空数据：</span>
            进入「关系图」页点击「清空项目」，或在浏览器设置中清除本站数据即可移除全部本地内容。
          </li>
          <li>
            <span className="font-medium text-ink-1">输入安全：</span>
            校验与修复不修改你的原始源文件；导入为覆盖式写入本地项目，建议在导入前保留源文件副本。
          </li>
        </ul>
      </Card>

      <Card data-testid="help-model" className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink-1">四表数据模型</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-2">
          <li><span className="font-medium text-ink-1">Space（空间）</span>：区域 / 楼层 / 厂区等层级对象，可含父级引用形成树。</li>
          <li><span className="font-medium text-ink-1">Asset（资产）</span>：设备 / 装置等，挂载到某个 Space。</li>
          <li><span className="font-medium text-ink-1">Sensor（测点）</span>：资产上的量测点，含量纲 / 单位。</li>
          <li><span className="font-medium text-ink-1">Observation（观测）</span>：测点的时序量测值，含时间戳 / 数值 / 质量标记。</li>
        </ul>
        <p className="mt-3 text-sm text-ink-2">
          规则引擎在四表之间检查引用完整性、唯一性、量纲单位、时间戳合理性与覆盖度等，
          问题可溯源到具体的表 / 行号 / 记录 ID / 字段。
        </p>
      </Card>

      <Card data-testid="help-faq" className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-ink-1">常见问题</h2>
        <dl className="mt-3 space-y-3 text-sm text-ink-2">
          <div>
            <dt className="font-medium text-ink-1">支持哪些文件格式？</dt>
            <dd className="mt-1">CSV 与 Excel（.xlsx / .xls）。每个工作表单独映射到一个目标表。</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-1">数据会被上传吗？</dt>
            <dd className="mt-1">不会。所有处理在浏览器本地完成，没有业务后端或网络上传。</dd>
          </div>
          <div>
            <dt className="font-medium text-ink-1">校验规则会修改我的数据吗？</dt>
            <dd className="mt-1">
              「校验」只读取并报告问题；「应用修复」在本地项目副本上做不可变更新并即时复检，
              不会触碰你的原始源文件。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink-1">如何迁移旧版本项目？</dt>
            <dd className="mt-1">
              v1 旧项目在导入时自动迁移为四表模型（v1→v2）。迁移仅补充缺失字段，不破坏既有数据。
            </dd>
          </div>
          <div>
            <dt className="font-medium text-ink-1">大表卡顿怎么办？</dt>
            <dd className="mt-1">
              v1.0.0 起数据预览默认对超过 100 行的表启用虚拟滚动，仅渲染可视区间行；
              校验改为分块执行，结果与逐条执行完全等价。
            </dd>
          </div>
        </dl>
      </Card>

      <p className="mt-8 text-xs text-ink-3">
        更多版本信息与变更记录见仓库 <code className="rounded bg-surface-2 px-1">CHANGELOG.md</code>。
        若发现缺陷或想参与贡献，请在 GitHub 仓库提交 Issue 或 Pull Request。
      </p>
    </div>
  );
}
