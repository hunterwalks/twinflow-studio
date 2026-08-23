import Link from "next/link";

interface Crumb {
  href: string;
  label: string;
}

interface BreadcrumbsProps {
  /** 当前页标签；首项固定为「首页」。 */
  items: Crumb[];
}

/** 面包屑：子页面顶部显示「首页 › 当前页」，首页本身不渲染本组件。 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="面包屑" data-testid="breadcrumbs" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-brand-600 hover:underline" data-testid="crumb-home">
            首页
          </Link>
        </li>
        {items.map((c) => (
          <li key={c.href} className="flex items-center gap-1.5">
            <span aria-hidden className="text-slate-300">
              ›
            </span>
            <span className="font-medium text-slate-700" data-testid="crumb-current" aria-current="page">
              {c.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
