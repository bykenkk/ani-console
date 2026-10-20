import clsx from "clsx";
import type { HomeTimeRange } from "..";

type PeriodSwitchProps = {
  value: HomeTimeRange;
  onChange: (value: HomeTimeRange) => void;
  ariaLabel?: string;
};

const PERIODS: Array<{ value: HomeTimeRange; label: string }> = [
  { value: "1d", label: "1 天" },
  { value: "7d", label: "7 天" },
  { value: "30d", label: "30 天" },
];

export default function PeriodSwitch({
  value,
  onChange,
  ariaLabel = "时间范围",
}: PeriodSwitchProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={ariaLabel}>
      {PERIODS.map((period) => (
        <button
          key={period.value}
          type="button"
          className={clsx(
            "inline-flex h-7 cursor-pointer items-center justify-center rounded-sm border-0 px-4 py-0 [font:inherit] text-[12px]! leading-[inherit]!",
            period.value === value
              ? "bg-(--home-primary-soft) text-(--home-primary) font-bold!"
              : "bg-transparent text-(--home-text-secondary) [&:hover]:bg-[#f5f5f5]",
          )}
          aria-pressed={period.value === value}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
