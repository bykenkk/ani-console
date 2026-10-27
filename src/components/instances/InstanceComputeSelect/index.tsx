import { useState } from "react";
import { Radio } from "@arco-design/web-react";
import type { ComputeType, InstancePreset } from "@/api/instances";
import PresetSelect, { type PresetSelectProps } from "./PresetSelect";

type InstanceComputeSelectProps = {
  usage?: PresetSelectProps["usage"];
  computeType?: ComputeType;
  value?: InstancePreset;
  onChange?: (preset?: InstancePreset) => void;
  onSelect?: (preset?: InstancePreset) => void;
  onTypeChange?: (type: ComputeType) => void;
  disabled?: boolean;
};

export default function InstanceComputeSelect({
  usage,
  computeType: fixedComputeType,
  value,
  onChange,
  onSelect,
  onTypeChange,
  disabled,
}: InstanceComputeSelectProps) {
  const [computeType, setComputeType] = useState<ComputeType>(value?.compute_type ?? "cpu");
  const selectedType = fixedComputeType ?? value?.compute_type ?? computeType;
  const changeType = (next: ComputeType) => {
    if (disabled || fixedComputeType || next === selectedType) return;
    setComputeType(next);
    // 类型切换只更新字段值，选择具体规格后再触发校验。
    onChange?.(undefined);
    onTypeChange?.(next);
  };

  return (
    <div className="flex items-center gap-3">
      {!fixedComputeType && (
        <div className="shrink-0">
          <Radio.Group
            type="button"
            aria-label="算力类型"
            options={[
              { value: "cpu", label: "CPU" },
              { value: "gpu", label: "GPU" },
            ]}
            value={selectedType}
            onChange={changeType}
            disabled={disabled}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <PresetSelect
          key={selectedType}
          usage={usage}
          computeType={selectedType}
          value={value}
          onChange={(preset) => {
            onChange?.(preset);
            onSelect?.(preset);
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
