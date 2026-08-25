"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { DemoView } from "@/components/DemoView";
import { loadDemoData } from "@/lib/loadDemo";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";

function DemoInner() {
  const params = useSearchParams();
  const view = params.get("view") ?? undefined;
  const result = useMemo(() => loadDemoData(view), [view]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="合成数据 Demo"
        actions={
          result.status === "success" ? (
            <span className="rounded-full bg-ok-bg px-3 py-1 text-xs font-medium text-ok">数据已加载</span>
          ) : undefined
        }
      />
      <DemoView result={result} />
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/validate" variant="secondary">
          去校验 →
        </ButtonLink>
        <ButtonLink href="/graph" variant="secondary">
          看关系图 →
        </ButtonLink>
      </div>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-8 text-sm text-ink-3 sm:px-6">加载中…</div>}>
      <DemoInner />
    </Suspense>
  );
}
