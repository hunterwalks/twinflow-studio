interface EmptyStateProps {
  message?: string;
}

/** 空状态提示：用于数据集为空或筛选无结果时。 */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="text-3xl" aria-hidden>🗂️</div>
      <p className="mt-3 text-sm font-medium text-slate-600">暂无数据</p>
      <p className="mt-1 text-sm text-slate-400">
        {message ?? "当前没有可加载的对象记录。请确认数据集或来源配置后重试。"}
      </p>
    </div>
  );
}
