"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { APP_VERSION } from "@/lib/version";
import { ALL_NAV, HOME_NAV } from "./nav";

function activeLabel(pathname: string): string | null {
  if (pathname === "/") return null;
  const exact = ALL_NAV.find((n) => n.href === pathname);
  if (exact) return exact.label;
  const prefix = ALL_NAV.filter((n) => n.href !== "/").find(
    (n) => pathname.startsWith(`${n.href}/`) || pathname === n.href,
  );
  return prefix?.label ?? null;
}

interface TopBarProps {
  /** 页面级操作区（如导出按钮），渲染在右上角。 */
  actions?: ReactNode;
}

/** 极简顶栏（v1.4）：左侧面包屑定位当前页，右侧版本与本地优先标识 + 可选操作区。 */
export function TopBar({ actions }: TopBarProps) {
  const pathname = usePathname() ?? "/";
  const label = activeLabel(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-line bg-surface/85 px-4 backdrop-blur sm:px-6">
      <nav aria-label="位置" className="min-w-0 text-sm">
        {label ? (
          <ol className="flex items-center gap-1.5 text-ink-2">
            <li>
              <Link href="/" className="hover:text-brand-600 hover:underline">
                {HOME_NAV.label}
              </Link>
            </li>
            <li aria-hidden className="text-ink-3">
              ›
            </li>
            <li className="truncate font-medium text-ink-1">{label}</li>
          </ol>
        ) : (
          <span className="font-medium text-ink-1">TwinFlow Studio</span>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {actions}
        <span
          title="所有解析、校验与报告均在浏览器本地完成"
          className="hidden items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-ink-2 sm:inline-flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-ok" />
          本地优先
        </span>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          v{APP_VERSION}
        </span>
      </div>
    </header>
  );
}
