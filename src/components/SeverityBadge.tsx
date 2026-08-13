import { SEVERITY_LABEL, type Severity } from "@/lib/rules/types";

const STYLE: Record<Severity, string> = {
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

/** 级别徽标。 */
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-xs font-medium ${STYLE[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
