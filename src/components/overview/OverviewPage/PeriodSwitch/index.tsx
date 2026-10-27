import { Radio } from "@arco-design/web-react";
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
    <Radio.Group
      type="button"
      size="small"
      aria-label={ariaLabel}
      options={PERIODS}
      value={value}
      onChange={onChange}
    />
  );
}
