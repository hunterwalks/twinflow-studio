interface EmptyStateProps {
  /** 发生了什么（一句话）。默认 "暂无数据"。 */
  title?: string;
  /** 兼容旧调用：等同 title。 */
  message?: string;
  /** 为什么（可选补充）。 */
  reason?: string;
  /** 下一步动作（可选）。 */
  next?: string;
  /** 稳定定位符，便于 E2E 检测空态。默认 "empty-state"。 */
  testid?: string;
}

/**
 * 统一空状态提示（v1.3.0 三段式：发生了什么 / 为什么 / 下一步）。
 * 用于数据集为空或筛选无结果时；全站复用，保持文案结构一致。
 */
export function EmptyState({
  title,
  message,
  reason,
  next,
  testid = "empty-state",
}: EmptyStateProps) {
  const heading = title ?? message ?? "暂无数据";
  return (
    <div
      data-testid={testid}
      className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center"
    >
      <div className="text-3xl" aria-hidden>
        🗂️
      </div>
      <p className="mt-3 text-sm font-medium text-slate-600">{heading}</p>
      {reason && <p className="mt-1 text-sm text-slate-400">{reason}</p>}
      {next && <p className="mt-2 text-xs text-slate-400">下一步：{next}</p>}
    </div>
  );
}
