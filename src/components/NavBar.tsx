import Link from "next/link";
import { APP_VERSION } from "@/lib/version";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/import", label: "导入" },
  { href: "/validate", label: "校验" },
  { href: "/project", label: "项目" },
  { href: "/graph", label: "关系图" },
  { href: "/report", label: "报告" },
  { href: "/compare", label: "对比" },
  { href: "/model", label: "模型" },
  { href: "/help", label: "帮助" },
];

/** 全局顶部导航（v1.0.0）：统一入口，含「帮助」离线页。 */
export function NavBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900" data-testid="nav-logo">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-xs font-bold text-white">
            T
          </span>
          <span>TwinFlow Studio</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            v{APP_VERSION}
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-slate-500 hover:text-brand-600 hover:underline"
              data-testid={`nav-${l.href === "/" ? "home" : l.href.slice(1)}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
