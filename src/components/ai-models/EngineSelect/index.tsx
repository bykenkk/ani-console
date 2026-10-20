import { Select } from "@arco-design/web-react";
import type { CSSProperties } from "react";

export type EngineType = "vllm" | "sglang";

export default function EngineSelect({
  value,
  onChange,
  disabled,
  style,
}: {
  value?: string;
  onChange?: (value: EngineType) => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <Select
      aria-label="引擎类型"
      placeholder="请选择引擎类型"
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={style}
      options={[
        { value: "vllm", label: "vLLM" },
        { value: "sglang", label: "SGLang" },
      ]}
    />
  );
}
