import type { ReactNode } from "react";

interface CardProps {
  /** 渲染标签，默认 section。 */
  as?: "section" | "div" | "article";
  className?: string;
  children: ReactNode;
  /** 测试锚点。 */
  testid?: string;
}

/** 通用卡片容器：圆角 + 描边 + 轻投影，作为所有内容块的视觉底座。 */
export function Card({ as: Tag = "section", className = "", children, testid }: CardProps) {
  return (
    <Tag
      data-testid={testid}
      className={`rounded-xl border border-line bg-surface shadow-card-sm ${className}`}
    >
      {children}
    </Tag>
  );
}

/** 卡片标题行（左标题 + 右侧可选元信息/操作）。 */
export function CardHead({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h3 className="text-sm font-semibold text-ink-1">{title}</h3>
      {meta && <span className="text-xs text-ink-3">{meta}</span>}
    </header>
  );
}
