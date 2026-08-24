"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_VERSION } from "@/lib/version";
import { Icon } from "./icons";
import { ALL_NAV, HOME_NAV, NAV_GROUPS, type NavItem } from "./nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

/** 桌面端深色左侧导航栏（v1.4）：首页独立 + 数据建模/质量治理/高级工具 三段分组。 */
export function Sidebar() {
  const pathname = usePathname() ?? "/";
  return (
    <aside
      data-testid="sidebar"
      className="hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-ink-1 md:flex"
    >
      <Link
        href="/"
        data-testid="nav-logo"
        className="flex items-center gap-2.5 px-5 py-4 text-white hover:opacity-90"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-base font-bold">
          T
        </span>
        <span className="flex-1 text-[15px] font-semibold tracking-tight">TwinFlow Studio</span>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-slate-300">
          v{APP_VERSION}
        </span>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3" aria-label="主导航">
        <NavRow item={HOME_NAV} pathname={pathname} />
        {NAV_GROUPS.map((g) => (
          <div key={g.key}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {g.label}
            </p>
            <div className="space-y-0.5">
              {g.items.map((it) => (
                <NavRow key={it.href} item={it} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/5 px-5 py-3 text-[11px] leading-4 text-slate-500">
        本地优先 · 数据不出浏览器
      </div>
    </aside>
  );
}

/** 移动端横向导航（v1.4）：侧边栏在窄屏折叠为此条，保持全部入口可达。 */
export function MobileNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav
      data-testid="mobile-nav"
      aria-label="主导航"
      className="flex gap-1 overflow-x-auto border-b border-line bg-ink-1 px-3 py-2 md:hidden"
    >
      {ALL_NAV.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
              active ? "bg-brand-600 text-white" : "text-slate-300"
            }`}
          >
            <Icon name={it.icon} className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
