import { Icon } from "./icons";

export interface Step {
  label: string;
}

interface StepperProps {
  steps: Step[];
  /** 当前步骤索引（0-based）。 */
  current: number;
  /** 已完成步骤数（≤ current 表示进行中；用于高亮已通过步骤）。 */
  completed?: number;
}

/** 步骤指示器（v1.4）：横向展示导入向导的阶段进度，已完成打勾、当前高亮。 */
export function Stepper({ steps, current, completed = current }: StepperProps) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="导入步骤">
      {steps.map((s, i) => {
        const done = i < completed;
        const active = i === current;
        return (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                done
                  ? "bg-ok text-white"
                  : active
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-ink-3"
              }`}
            >
              {done ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span
              className={`text-sm font-medium ${active ? "text-ink-1" : done ? "text-ink-2" : "text-ink-3"}`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
