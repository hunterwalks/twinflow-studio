interface ObjectCountsProps {
  spaces: number;
  assets: number;
  sensors: number;
  observations: number;
}

const CARDS = [
  { key: "spaces", label: "空间 Space", tone: "bg-brand-50 text-brand-700" },
  { key: "assets", label: "资产 Asset", tone: "bg-emerald-50 text-emerald-700" },
  { key: "sensors", label: "传感器 Sensor", tone: "bg-amber-50 text-amber-700" },
  { key: "observations", label: "观测 Observation", tone: "bg-sky-50 text-sky-700" },
] as const;

/** 对象数量概览卡片。 */
export function ObjectCounts({
  spaces,
  assets,
  sensors,
  observations,
}: ObjectCountsProps) {
  const values: Record<string, number> = { spaces, assets, sensors, observations };
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map((card) => (
        <div key={card.key} data-testid={`count-${card.key}`} className={`rounded-lg border border-slate-200 px-4 py-3 ${card.tone}`}>
          <div className="text-xs font-medium opacity-80">{card.label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{values[card.key]}</div>
        </div>
      ))}
    </div>
  );
}
