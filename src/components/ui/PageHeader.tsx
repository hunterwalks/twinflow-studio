import type { ReactNode } from "react";

interface PageHeaderProps {
  /** 上方小标签，如「TwinFlow Studio · 质量校验」。 */
  eyebrow?: string;
  title: ReactNode;
  /** 一句话说明，控制在一行半内，避免大段辅助文字。 */
  lead?: ReactNode;
  /** 右上角操作区（主行动按钮等）。 */
  actions?: ReactNode;
}

/** 统一的页面头：小标签 + 标题 + 一句话说明 + 操作区，视觉重心明确。 */
export function PageHeader({ eyebrow, title, lead, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="text-sm font-medium text-brand-600">{eyebrow}</p>}
      <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink-1">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {lead && <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-2">{lead}</p>}
    </div>
  );
}
