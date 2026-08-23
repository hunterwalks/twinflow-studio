interface ErrorStateProps {
  /** 发生了什么（一句话）。默认 "加载失败"。 */
  title?: string;
  /** 为什么（具体错误原因）。 */
  message: string;
  /** 下一步动作（可选）。 */
  next?: string;
  /** 稳定定位符，便于 E2E 检测错误态。默认 "error-state"。 */
  testid?: string;
}

/**
 * 统一错误状态提示（v1.3.0 三段式：发生了什么 / 为什么 / 下一步）。
 * 用于数据加载失败、解析失败等场景；全站复用，保持文案结构一致。
 */
export function ErrorState({
  title = "加载失败",
  message,
  next = "若持续失败，请检查本地数据集文件是否完整。",
  testid = "error-state",
}: ErrorStateProps) {
  return (
    <div
      data-testid={testid}
      className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center"
      role="alert"
    >
      <div className="text-3xl" aria-hidden>
        ⚠️
      </div>
      <p className="mt-3 text-sm font-medium text-red-700">{title}</p>
      <p className="mt-1 text-sm text-red-500">{message}</p>
      {next && <p className="mt-2 text-xs text-red-400">下一步：{next}</p>}
    </div>
  );
}
