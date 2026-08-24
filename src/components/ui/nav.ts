import type { IconName } from "./icons";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

/** 侧边栏导航数据：首页独立常驻，业务入口分三组。 */
export const HOME_NAV: NavItem = { href: "/", label: "首页", icon: "home" };

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "modeling",
    label: "数据建模",
    items: [
      { href: "/import", label: "导入", icon: "import" },
      { href: "/project", label: "项目", icon: "project" },
      { href: "/graph", label: "关系图", icon: "graph" },
    ],
  },
  {
    key: "govern",
    label: "质量治理",
    items: [
      { href: "/validate", label: "校验", icon: "validate" },
      { href: "/report", label: "报告", icon: "report" },
      { href: "/compare", label: "对比", icon: "compare" },
    ],
  },
  {
    key: "advanced",
    label: "高级工具",
    items: [
      { href: "/model", label: "模型", icon: "model" },
      { href: "/help", label: "帮助", icon: "help" },
    ],
  },
];

/** 扁平化全部导航项（用于移动端横向导航与激活判定）。 */
export const ALL_NAV: NavItem[] = [
  HOME_NAV,
  ...NAV_GROUPS.flatMap((g) => g.items),
];
