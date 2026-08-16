interface ErrorStateProps {
  message: string;
  /** 稳定定位符，便于 E2E 检测错误态。默认 "error-state"。 */
  testid?: string;
}

/** 错误状态提示：用于数据加载失败时给出可理解说明。 */
export function ErrorState({ message, testid = "error-state" }: ErrorStateProps) {
  return (
    <div data-testid={testid} className="rounded-lg border border-red-200 bg-red-50 px-6 py-10 text-center" role="alert">
      <div className="text-3xl" aria-hidden>⚠️</div>
      <p className="mt-3 text-sm font-medium text-red-700">加载失败</p>
      <p className="mt-1 text-sm text-red-500">{message}</p>
      <p className="mt-2 text-xs text-red-400">若持续失败，请检查本地数据集文件是否完整。</p>
    </div>
  );
}
