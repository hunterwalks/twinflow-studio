"use client";

import { useState } from "react";
import { useProject } from "@/lib/project/ProjectProvider";

/**
 * 本地存储不可用时的全局提示（隐私模式 / 禁用站点数据 / 配额耗尽）。
 * 给出原因与恢复动作，避免用户误以为数据已持久化。
 */
export function StorageBanner() {
  const { storageWarning } = useProject();
  const [dismissed, setDismissed] = useState(false);
  if (!storageWarning || dismissed) return null;
  return (
    <div
      data-testid="storage-warning"
      role="alert"
      className="flex items-start justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800"
    >
      <span>⚠️ {storageWarning}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded px-2 py-0.5 text-amber-700 hover:bg-amber-100"
        aria-label="关闭提示"
      >
        知道了
      </button>
    </div>
  );
}
