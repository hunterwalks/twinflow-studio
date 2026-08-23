"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_VERSION } from "@/lib/version";

interface NavItem {
  href: string;
  label: string;
  group: "data" | "govern" | "advanced";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "首页", group: "data" },
  { href: "/import", label: "导入", group: "data" },
  { href: "/project", label: "项目", group: "data" },
  { href: "/graph", label: "关系图", group: "data" },
  { href: "/validate", label: "校验", group: "govern" },
  { href: "/report", label: "报告", group: "govern" },
  { href: "/compare", label: "对比", group: "govern" },
  { href: "/model", label: "模型", group: "advanced" },
  { href: "/help", label: "帮助", group: "advanced" },
];

const GROUP_LABELS: Record<NavItem["group"], string> = {
  data: "数据",
  govern: "治理",
  advanced: "高级",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active
          ? "bg-brand-50 font-semibold text-brand-700"
          : "text-slate-500 hover:text-brand-600 hover:underline"
      }`}
      data-testid={`nav-${item.href === "/" ? "home" : item.href.slice(1)}`}
      data-active={active ? "true" : "false"}
    >
      {item.label}
    </Link>
  );
}

/** 全局顶部导航（v1.3.0）：分组入口 + 当前页高亮 + 窄屏折叠抽屉。 */
export function NavBar() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  const groups: NavItem["group"][] = ["data", "govern", "advanced"];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-x-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900" data-testid="nav-logo">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-xs font-bold text-white">
            T
          </span>
          <span>TwinFlow Studio</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            v{APP_VERSION}
          </span>
        </Link>

        {/* 桌面端：分组导航 */}
        <nav className="hidden flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm md:flex" data-testid="nav-desktop">
          {groups.map((g) => (
            <div key={g} className="flex items-center gap-x-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {GROUP_LABELS[g]}
              </span>
              {NAV_ITEMS.filter((i) => i.group === g).map((i) => (
                <NavLink key={i.href} item={i} pathname={pathname} />
              ))}
            </div>
          ))}
        </nav>

        {/* 移动端：汉堡按钮 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="切换导航菜单"
          aria-expanded={open}
          data-testid="nav-toggle"
          className="ml-auto rounded p-1.5 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {/* 移动端：折叠抽屉 */}
      {open && (
        <nav className="border-t border-slate-100 px-6 py-3 md:hidden" data-testid="nav-mobile">
          {groups.map((g) => (
            <div key={g} className="mb-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{GROUP_LABELS[g]}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                {NAV_ITEMS.filter((i) => i.group === g).map((i) => (
                  <span key={i.href} onClick={() => setOpen(false)}>
                    <NavLink item={i} pathname={pathname} />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
