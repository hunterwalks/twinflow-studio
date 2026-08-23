"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_VERSION } from "@/lib/version";

interface NavItem {
  href: string;
  label: string;
  group: "modeling" | "govern" | "advanced";
}

// 分组：首页独立常驻品牌区；业务入口分三组。
// 数据建模：导入 / 项目 / 关系图（建数据、看结构）
// 质量治理：校验 / 报告 / 对比（查问题、出成果）
// 高级工具：模型 / 帮助
const NAV_ITEMS: NavItem[] = [
  { href: "/import", label: "导入", group: "modeling" },
  { href: "/project", label: "项目", group: "modeling" },
  { href: "/graph", label: "关系图", group: "modeling" },
  { href: "/validate", label: "校验", group: "govern" },
  { href: "/report", label: "报告", group: "govern" },
  { href: "/compare", label: "对比", group: "govern" },
  { href: "/model", label: "模型", group: "advanced" },
  { href: "/help", label: "帮助", group: "advanced" },
];

const GROUP_LABELS: Record<NavItem["group"], string> = {
  modeling: "数据建模",
  govern: "质量治理",
  advanced: "高级工具",
};

const GROUP_ORDER: NavItem["group"][] = ["modeling", "govern", "advanced"];

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
      data-testid={`nav-${item.href === "/" ? "home" : item.href.slice(1)}`}
      data-active={active ? "true" : "false"}
      className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-brand-700"
      }`}
    >
      {item.label}
    </Link>
  );
}

/** 全局顶部导航（v1.3.1）：首页独立 + 数据建模/质量治理/高级工具 三段分组，实色高亮。 */
export function NavBar() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-4 py-2.5 sm:px-6">
        {/* 品牌区：首页独立常驻 */}
        <Link
          href="/"
          data-testid="nav-logo"
          className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1 font-semibold text-slate-900 hover:bg-slate-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
            T
          </span>
          <span className="hidden sm:inline">TwinFlow Studio</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            v{APP_VERSION}
          </span>
        </Link>

        {/* 桌面端：三段分组导航，单行不折行 */}
        <nav
          className="hidden flex-1 items-center gap-2 overflow-x-auto md:flex"
          data-testid="nav-desktop"
          aria-label="主导航"
        >
          {GROUP_ORDER.map((g) => (
            <div
              key={g}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-inset ring-slate-200"
            >
              <span className="select-none px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
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
          className="ml-auto rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>
      </div>

      {/* 移动端：折叠抽屉 */}
      {open && (
        <nav
          className="border-t border-slate-100 bg-white px-4 py-3 md:hidden"
          data-testid="nav-mobile"
          aria-label="主导航（移动）"
        >
          {GROUP_ORDER.map((g) => (
            <div key={g} className="mb-3 last:mb-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {GROUP_LABELS[g]}
              </p>
              <div className="flex flex-wrap gap-2">
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
