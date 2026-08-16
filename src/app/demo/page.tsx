"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DemoView } from "@/components/DemoView";
import { loadDemoData } from "@/lib/loadDemo";

function DemoInner() {
  const params = useSearchParams();
  const view = params.get("view") ?? undefined;
  const result = useMemo(() => loadDemoData(view), [view]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            ← 返回首页
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">合成数据 Demo</h1>
        </div>
        {result.status === "success" && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            数据已加载
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-500">
        演示数据集，仅用于功能验证。空状态与错误状态可通过{" "}
        <code className="rounded bg-slate-100 px-1">?view=empty</code> 与{" "}
        <code className="rounded bg-slate-100 px-1">?view=error</code> 查看。
      </p>

      <div className="mt-6">
        <DemoView result={result} />
      </div>
    </main>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-6 py-10 text-sm text-slate-400">加载中…</div>}>
      <DemoInner />
    </Suspense>
  );
}
